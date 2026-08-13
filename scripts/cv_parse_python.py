#!/usr/bin/env python3
"""
CLI CV/resume parser for the Node backend.

Tries the pip package `resume-parser` (resume_parser) first.
If that package cannot load (common on spaCy 3 / Python 3.12+),
falls back to a structured heuristic parser using pdfplumber/docx2txt.

Usage:
  python scripts/cv_parse_python.py /path/to/resume.pdf
  python scripts/cv_parse_python.py /path/to/resume.docx

Prints one JSON object to stdout. Errors go to stderr with exit code 1.
"""

from __future__ import annotations

import json
import os
import re
import sys
from typing import Any


EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}")
PHONE_RE = re.compile(
    r"(?:\+?62|0)[\s.-]?\d[\d\s.-]{7,14}"
    r"|(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}"
    r"|\+[1-9]\d{0,2}[\s.-]?\d[\d\s.-]{6,14}"
)
PRESENT_RE = re.compile(r"(present|current|now|ongoing|to\s+date|till\s+date|sekarang|saat\s+ini)", re.I)

MONTH = (
    r"(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|"
    r"aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|"
    r"januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)"
)
MONTH_NUM = {
    "jan": 1, "january": 1, "januari": 1,
    "feb": 2, "february": 2, "februari": 2,
    "mar": 3, "march": 3, "maret": 3,
    "apr": 4, "april": 4,
    "may": 5, "mei": 5,
    "jun": 6, "june": 6, "juni": 6,
    "jul": 7, "july": 7, "juli": 7,
    "aug": 8, "august": 8, "agustus": 8,
    "sep": 9, "sept": 9, "september": 9,
    "oct": 10, "october": 10, "oktober": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12, "desember": 12,
}

# "Full Stack Developer Nov 2025 – Present (9 months)"
TITLE_DATE_RE = re.compile(
    rf"^(?P<title>.+?)\s+(?P<start_month>{MONTH})\s+(?P<start_year>20\d{{2}}|"
    rf"19\d{{2}})\s*[-–—]\s*(?:(?P<end_present>present|current|now|ongoing|sekarang|saat\s+ini)|"
    rf"(?P<end_month>{MONTH})\s+(?P<end_year>20\d{{2}}|19\d{{2}}))"
    rf"(?:\s*\([^)]*\))?\s*$",
    re.I,
)
# Trailing date on company/project/school lines:
# "PT AGAT ... - Jakarta, Indonesia Jan 2025 - Present"
DATE_TAIL_RE = re.compile(
    rf"(?P<start_month>{MONTH})\s+(?P<start_year>20\d{{2}}|19\d{{2}})\s*[-–—]\s*"
    rf"(?:(?P<end_present>present|current|now|ongoing|sekarang|saat\s+ini)|"
    rf"(?P<end_month>{MONTH})\s+(?P<end_year>20\d{{2}}|19\d{{2}}))\s*$",
    re.I,
)
# "Bachelor of Computer Information Systems 2021 – 2024"
DEGREE_YEAR_RE = re.compile(
    r"^(?P<degree>.+?)\s+(?P<start_year>20\d{2}|19\d{2})\s*[-–—]\s*(?P<end_year>20\d{2}|19\d{2}|present|current)\s*$",
    re.I,
)
YEAR_RANGE_RE = re.compile(
    r"\b(?P<start_year>20\d{2}|19\d{2})\s*[-–—]\s*(?P<end_year>20\d{2}|19\d{2}|present|current|sekarang)\b",
    re.I,
)
LOCATION_POSTAL_RE = re.compile(r"^[A-Za-zÀ-ÿ .'-]+,\s*\d{4,6}\s*$")

SECTION_SUMMARY = re.compile(
    r"^(professional\s+summary|summary|profile|profil|ringkasan|objective|career\s+objective|about\s+me|tentang\s+saya)"
    r"(?:\s*:)?\s*",
    re.I,
)
# Prefer multi-word headings for prefix matches so prose like
# "experience as a Full Stack Developer..." does not flip sections.
SECTION_EXPERIENCE = re.compile(
    r"^(pengalaman(\s+kerja)?|riwayat\s+pekerjaan|professional\s+experience|work\s+experiences?|"
    r"employment(\s+history)?|relevant\s+experience|work\s+history|"
    r"career\s+history|work\s+experience|pengalaman\s+kerja)"
    r"(?:\s*:)?\s*",
    re.I,
)
SECTION_EXPERIENCE_ONLY = re.compile(
    r"^(experiences?|karir|pekerjaan)\s*$",
    re.I,
)
SECTION_PROJECTS = re.compile(
    r"^(project\s+experiences?|projects?|personal\s+projects?|selected\s+projects?|proyek|pengalaman\s+proyek)"
    r"(?:\s*:)?\s*",
    re.I,
)
SECTION_EDUCATION = re.compile(
    r"^(pendidikan|riwayat\s+pendidikan|education(\s*&\s*training)?|education\s+and\s+training|"
    r"academic(\s+background)?|educational\s+background|qualifications|akademik)"
    r"(?:\s*:)?\s*",
    re.I,
)
SECTION_SKILLS = re.compile(
    r"^(skills?(\s*&\s*languages?)?|keahlian(\s+teknis)?|kompetensi|technical\s+skills|"
    r"core\s+(competencies|skills)|key\s+skills|kemampuan|tools|technologies|"
    r"technical\s+proficiencies|expertise|languages?)"
    r"(?:\s*:)?\s*",
    re.I,
)
TITLE_AT_COMPANY_RE = re.compile(
    r"^(?P<title>.+?)\s+at\s+(?P<company>.+?)\s*$",
    re.I,
)
DEGREE_FROM_RE = re.compile(
    r"^(?P<degree>.+?)\s+from\s+(?P<institution>.+?)\s*$",
    re.I,
)
STANDALONE_DATE_RE = re.compile(
    rf"^(?P<start_month>{MONTH})\s+(?P<start_year>20\d{{2}}|19\d{{2}})\s*[-–—]\s*"
    rf"(?:(?P<end_present>present|current|now|ongoing|sekarang|saat\s+ini)|"
    rf"(?P<end_month>{MONTH})\s+(?P<end_year>20\d{{2}}|19\d{{2}}))"
    rf"(?:\s*\([^)]*\))?\s*$",
    re.I,
)
YEAR_ONLY_RE = re.compile(
    r"^(?P<start_year>20\d{2}|19\d{2})\s*[-–—]\s*(?P<end_year>20\d{2}|19\d{2}|present|current|sekarang)\s*$",
    re.I,
)

COMPANY_HINT = re.compile(
    r"\b(pt\.?|cv\.?|inc\.?|llc|ltd\.?|corp\.?|company|co\.?|resources|engineering|"
    r"pharmaceutical|university|universitas|institute|institut|school|group|bank|"
    r"telekomunikasi|teknologi|netcentric|nusantara)\b",
    re.I,
)
DEGREE_HINT = re.compile(
    r"\b(bachelor|master|phd|mba|diploma|associate|sarjana|magister|certification|"
    r"certificate|s1|s2|s3|d1|d2|d3|d4|professional\s+certification|"
    r"teknologi\s+informasi|information\s+technology|computer\s+information)\b",
    re.I,
)
DEGREE_MONTH_RE = re.compile(
    rf"^(?P<degree>.+?)\s+(?P<start_month>{MONTH})\s+(?P<start_year>20\d{{2}}|19\d{{2}})\s*[-–—]\s*"
    rf"(?:(?P<end_present>present|current|now|ongoing|sekarang|saat\s+ini)|"
    rf"(?P<end_month>{MONTH})\s+(?P<end_year>20\d{{2}}|19\d{{2}}))\s*$",
    re.I,
)
COVER_LETTER_RE = re.compile(
    r"(dear\s+hiring|dear\s+sir|yang\s+terhormat|i am writing to express|"
    r"express my (strong )?interest|subject:\s*application|"
    r"hiring manager|sincerely,|best regards|hormat\s+saya)",
    re.I,
)
JOB_TITLE_SKILL_BLOCK = re.compile(
    r"^(developer|engineer|manager|analyst|designer|intern|consultant|"
    r"officer|lead|architect|specialist|scientist|staff|full\s+stack)$",
    re.I,
)
INSTITUTION_HINT = re.compile(
    r"\b(university|universitas|college|institut|institute|school|academy|stti|ccit|ftui|"
    r"politeknik|niit|i-tech|sma|smk)\b",
    re.I,
)
BULLET_RE = re.compile(r"^[•●▪◦\-\*]\s*")
PRIVATE_USE_RE = re.compile(r"[\ue000-\uf8ff]")
SKILL_LABEL_RE = re.compile(
    r"(?i)\b(hard\s+skills|soft\s+skills|languages?|programming|frontend|backend|database|"
    r"concepts/?\s*tools?|tools)\s*(\([^)]*\))?\s*:\s*"
)


def _emit(payload: dict[str, Any], code: int = 0) -> None:
    sys.stdout.write(json.dumps(payload, ensure_ascii=False))
    sys.stdout.write("\n")
    sys.exit(code)


def _error_payload(err: BaseException, *, prefix: str | None = None) -> dict[str, Any]:
    """Structured error object for the Node bridge / VPS debugging."""
    message = str(err).strip() or err.__class__.__name__
    if prefix:
        message = f"{prefix}: {message}"
    payload: dict[str, Any] = {
        "error": message,
        "error_type": err.__class__.__name__,
    }
    missing = getattr(err, "name", None)
    if isinstance(err, ModuleNotFoundError):
        if not missing:
            match = re.search(r"No module named ['\"]([^'\"]+)['\"]", message)
            missing = match.group(1) if match else None
        if missing:
            payload["missing_module"] = missing
        payload["hint"] = (
            f"Install deps in a venv, then point CV_PYTHON_BIN at that interpreter. "
            f"Example: python -m venv .venv && .venv/bin/pip install -r requirements-cv-parser.txt"
        )
    elif isinstance(err, ImportError):
        payload["hint"] = (
            "A required Python package failed to import. "
            "Use a venv and: pip install -r requirements-cv-parser.txt"
        )
    return payload


def _extract_text(path: str) -> str:
    lower = path.lower()
    if lower.endswith(".pdf"):
        import pdfplumber

        parts: list[str] = []
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                parts.append(page.extract_text() or "")
        text = "\n".join(parts)
        # Drop PDF viewer page footers if present
        text = re.sub(r"(?m)^--\s*\d+\s+of\s+\d+\s*--\s*$", "", text)
        return text.strip()

    if lower.endswith(".docx") or lower.endswith(".doc"):
        import docx2txt

        return (docx2txt.process(path) or "").strip()

    raise ValueError("Unsupported file type. Use PDF or DOCX.")


def _render_pdf_pages(path: str, max_pages: int = 3, resolution: int = 150) -> dict[str, Any]:
    """
    Render PDF pages to temp PNG files for OCR.

    Used by the Node OCR layer instead of @napi-rs/canvas, which can segfault
    on Windows when rendering image-only / scanned PDFs in-process.
    """
    import tempfile

    import pdfplumber

    max_pages = max(1, int(max_pages or 3))
    resolution = max(72, int(resolution or 150))
    images: list[str] = []

    with pdfplumber.open(path) as pdf:
        page_count = len(pdf.pages)
        for index, page in enumerate(pdf.pages[:max_pages]):
            rendered = page.to_image(resolution=resolution)
            safe_name = re.sub(r"[^A-Za-z0-9._-]+", "_", os.path.basename(path))
            out_path = os.path.join(
                tempfile.gettempdir(),
                f"cv_ocr_{os.getpid()}_{index}_{safe_name}.png",
            )
            rendered.save(out_path, format="PNG")
            images.append(out_path)

    return {
        "images": images,
        "page_count": page_count,
        "rendered": len(images),
        "resolution": resolution,
    }


def _normalize_lines(text: str) -> list[str]:
    # Normalize common PDF mojibake for en-dash / bullets / private-use icons
    text = (
        text.replace("\r", "")
        .replace("\u00a0", " ")
        .replace("\uf0b7", "•")
        .replace("â€“", "–")
        .replace("Ã¢â‚¬â€œ", "–")
    )
    text = PRIVATE_USE_RE.sub(" ", text)
    # Common OCR confusions on resume fonts
    text = re.sub(r"\bCodelgniter\b", "CodeIgniter", text, flags=re.I)
    text = re.sub(r"\bSTTI\s+NIT\s+I-?Tech\b", "STTI NIIT I-Tech", text, flags=re.I)
    text = re.sub(r"\bSTTI\s+NIT\b", "STTI NIIT", text, flags=re.I)
    return [re.sub(r"\s+", " ", line).strip() for line in text.split("\n")]


def _split_sections(lines: list[str]) -> dict[str, list[str]]:
    sections: dict[str, list[str]] = {
        "profile": [],
        "summary": [],
        "experience": [],
        "projects": [],
        "education": [],
        "skills": [],
    }
    current = "profile"
    # Jobstreet exports often glue the heading onto the first content line:
    # "Career History Full Stack Developer at EGI Resources"
    section_rules = (
        (SECTION_SUMMARY, "summary"),
        (SECTION_EXPERIENCE, "experience"),
        (SECTION_EXPERIENCE_ONLY, "experience"),
        (SECTION_PROJECTS, "projects"),
        (SECTION_EDUCATION, "education"),
        (SECTION_SKILLS, "skills"),
    )
    for line in lines:
        if not line:
            continue
        matched = False
        for pattern, name in section_rules:
            m = pattern.match(line)
            if not m:
                continue
            rest = line[m.end() :].strip()
            # Heading-only line, or heading + whitespace-separated content.
            # Reject glued words like "Employment-focused...".
            if rest:
                boundary = line[m.end() - 1] if m.end() > 0 else ""
                if boundary not in " \t:":
                    continue
            current = name
            if rest:
                sections.setdefault(current, []).append(rest)
            matched = True
            break
        if not matched:
            sections.setdefault(current, []).append(line)
    return sections


def _month_num(token: str | None) -> int | None:
    if not token:
        return None
    return MONTH_NUM.get(token.lower().rstrip("."))


def _fix_ocr_year(
    year: int,
    *,
    is_current: bool = False,
    start_year: int | None = None,
) -> int:
    """Fix OCR digit confusions only when the year is impossibly in the future."""
    from datetime import datetime

    now = datetime.now().year
    max_allowed = now + (1 if is_current else 0)
    if 1990 <= year <= max_allowed:
        return year

    candidates: list[int] = []
    token = str(year)
    for src, dst in (("8", "5"), ("5", "8"), ("6", "0"), ("0", "6"), ("3", "8"), ("8", "3")):
        if src in token:
            try:
                candidates.append(int(token.replace(src, dst, 1)))
            except ValueError:
                pass
    valid = [c for c in candidates if 1990 <= c <= max_allowed]
    if start_year is not None:
        valid = [c for c in valid if c >= start_year - 1]
    if not valid:
        return max_allowed if year > max_allowed else year
    target = now if is_current else (start_year + 2 if start_year is not None else now)
    return min(valid, key=lambda c: abs(c - target))


def _ym(
    month: str | None,
    year: str | None,
    *,
    is_current: bool = False,
    start_year: int | None = None,
) -> str | None:
    if not year:
        return None
    try:
        year_i = _fix_ocr_year(int(year), is_current=is_current, start_year=start_year)
    except ValueError:
        return None
    m = _month_num(month) or 1
    return f"{year_i}-{m:02d}"


def _dates_from_match(m: re.Match[str]) -> dict[str, Any]:
    is_current = bool(m.groupdict().get("end_present"))
    start = _ym(m.group("start_month"), m.group("start_year"), is_current=is_current)
    start_year = int(start[:4]) if start else None
    end = None
    if not is_current:
        end = _ym(
            m.groupdict().get("end_month"),
            m.groupdict().get("end_year"),
            is_current=False,
            start_year=start_year,
        )
    return {
        "start_date": start,
        "end_date": end,
        "is_current": is_current,
    }


def _parse_title_date(line: str) -> dict[str, Any] | None:
    m = TITLE_DATE_RE.match(line)
    if not m:
        return None
    title = m.group("title").strip(" |-–—")
    # Company/school lines with trailing dates must not be treated as job titles.
    if re.search(r"\s[-–—]\s", title) and (
        COMPANY_HINT.search(title)
        or INSTITUTION_HINT.search(title)
        or re.search(r",\s*[A-Za-z]", title)
    ):
        return None
    if COMPANY_HINT.search(title) and not re.search(
        r"(engineer|developer|programmer|intern|manager|analyst|designer|freelance)",
        title,
        re.I,
    ):
        return None
    return {
        "job_title": title,
        **_dates_from_match(m),
    }


def _strip_location_suffix(org: str) -> str:
    org = PRIVATE_USE_RE.sub(" ", org)
    org = re.sub(r"\s+", " ", org).strip(" -–—\t")
    # Keep campus/brand suffixes that look like locations to the generic stripper.
    if re.search(r"[-–—]\s*(i-?tech|niit|ftui|ccit|ui|itb|ugm)\b", org, re.I):
        return org.strip(" -–—")
    org = re.sub(
        r"\s*[-–—]\s*[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]*,\s*[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]*\s*$",
        "",
        org,
    )
    org = re.sub(
        r"\s*[-–—]\s*(Indonesia|Singapore|Malaysia|USA|UK|Japan|Germany|Remote)\s*$",
        "",
        org,
        flags=re.I,
    )
    org = re.sub(
        r"\s*[-–—]\s*(Jakarta|Depok|Bandung|Surabaya|Bekasi|Tangerang|Bali|Yogyakarta)\s*$",
        "",
        org,
        flags=re.I,
    )
    return org.strip(" -–—")


def _parse_org_date(line: str) -> dict[str, Any] | None:
    """Company/project/school line with dates at the end."""
    m = DATE_TAIL_RE.search(line)
    if not m or m.start() < 3:
        return None
    if line[m.start() - 1].isalnum():
        return None
    org = _strip_location_suffix(line[: m.start()])
    if not org or len(org) < 2:
        return None
    if org.endswith(".") or len(org.split()) > 16:
        return None
    return {"organization": org, **_dates_from_match(m)}


def _looks_like_company(line: str) -> bool:
    if not line or len(line) > 80:
        return False
    if TITLE_DATE_RE.match(line) or DEGREE_YEAR_RE.match(line) or _parse_org_date(line):
        return False
    if BULLET_RE.match(line) or line.endswith("."):
        return False
    if EMAIL_RE.search(line) or PHONE_RE.search(line):
        return False
    if COMPANY_HINT.search(line):
        return True
    words = line.split()
    return 1 <= len(words) <= 8 and not DEGREE_HINT.search(line)


def _looks_like_job_title(line: str) -> bool:
    if not line or len(line) > 70 or line.endswith("."):
        return False
    if _parse_org_date(line) or TITLE_DATE_RE.match(line) or DEGREE_HINT.search(line):
        return False
    if BULLET_RE.match(line) or EMAIL_RE.search(line) or PHONE_RE.search(line):
        return False
    words = line.split()
    if not (1 <= len(words) <= 8):
        return False
    jobish = re.search(
        r"(engineer|developer|programmer|intern|internship|manager|analyst|designer|"
        r"freelance|consultant|officer|lead|architect|specialist|scientist)",
        line,
        re.I,
    )
    return bool(jobish) or (2 <= len(words) <= 6)


def _looks_like_category_tag(line: str) -> bool:
    if not line or line.endswith(".") or len(line) > 40:
        return False
    if _parse_org_date(line) or TITLE_DATE_RE.match(line) or DEGREE_HINT.search(line):
        return False
    words = line.split()
    return 1 <= len(words) <= 4 and not _looks_like_job_title(line)


def _is_entry_boundary(line: str) -> bool:
    return bool(
        _parse_title_date(line)
        or _parse_org_date(line)
        or TITLE_AT_COMPANY_RE.match(line)
        or DEGREE_FROM_RE.match(line)
        or SECTION_EDUCATION.match(line)
        or SECTION_SKILLS.match(line)
        or SECTION_PROJECTS.match(line)
        or SECTION_EXPERIENCE.match(line)
    )


def _is_noise_desc_line(line: str) -> bool:
    return bool(
        re.match(r"^key\s+impacts?\s*&?\s*responsibilities?\s*:?\s*$", line, re.I)
        or re.match(r"^responsibilities?\s*:?\s*$", line, re.I)
    )


def _parse_experiences(lines: list[str]) -> list[dict[str, Any]]:
    experiences: list[dict[str, Any]] = []
    i = 0
    while i < len(lines):
        line = lines[i]

        at_m = TITLE_AT_COMPANY_RE.match(line)
        if at_m and len(at_m.group("title").split()) <= 8:
            dates = {"start_date": None, "end_date": None, "is_current": False}
            j = i + 1
            if j < len(lines):
                date_m = STANDALONE_DATE_RE.match(lines[j])
                if date_m:
                    dates = _dates_from_match(date_m)
                    j += 1
            desc_parts: list[str] = []
            while j < len(lines) and not _is_entry_boundary(lines[j]):
                if STANDALONE_DATE_RE.match(lines[j]):
                    break
                if _is_noise_desc_line(lines[j]):
                    j += 1
                    continue
                cleaned = BULLET_RE.sub("", lines[j]).strip()
                if cleaned:
                    desc_parts.append(cleaned)
                j += 1
            experiences.append(
                {
                    "company_name": at_m.group("company").strip(),
                    "job_title": at_m.group("title").strip(),
                    "start_date": dates["start_date"],
                    "end_date": dates["end_date"],
                    "is_current": dates["is_current"],
                    "description": "\n".join(desc_parts) if desc_parts else None,
                }
            )
            i = j
            continue

        org_info = _parse_org_date(line)
        title_info = _parse_title_date(line)
        # Only prefer org-date when the *organization* looks corporate.
        # Do not use the en-dash inside "Nov 2025 – Present" as a signal.
        prefer_org = bool(org_info) and (
            not title_info
            or COMPANY_HINT.search(org_info["organization"])
            or INSTITUTION_HINT.search(org_info["organization"])
            or bool(re.search(r"\s[-–—]\s", org_info["organization"]))
        )
        if title_info and prefer_org and _looks_like_job_title(title_info["job_title"]):
            # "Full Stack Developer Nov 2025 - Present" must stay title-first.
            prefer_org = False

        if prefer_org and org_info:
            job_title = None
            desc_parts = []
            j = i + 1
            if j < len(lines) and _looks_like_job_title(lines[j]):
                job_title = lines[j]
                j += 1
            if j < len(lines) and _looks_like_category_tag(lines[j]):
                j += 1
            while j < len(lines) and not _is_entry_boundary(lines[j]):
                if _is_noise_desc_line(lines[j]):
                    j += 1
                    continue
                cleaned = BULLET_RE.sub("", lines[j]).strip()
                if cleaned:
                    desc_parts.append(cleaned)
                j += 1
            experiences.append(
                {
                    "company_name": org_info["organization"],
                    "job_title": job_title,
                    "start_date": org_info["start_date"],
                    "end_date": org_info["end_date"],
                    "is_current": org_info["is_current"],
                    "description": "\n".join(desc_parts) if desc_parts else None,
                }
            )
            i = j
            continue

        if title_info:
            company = None
            desc_parts = []
            j = i + 1
            if j < len(lines) and _looks_like_company(lines[j]):
                company = lines[j]
                j += 1
            while j < len(lines) and not _is_entry_boundary(lines[j]):
                if _is_noise_desc_line(lines[j]):
                    j += 1
                    continue
                cleaned = BULLET_RE.sub("", lines[j]).strip()
                if cleaned:
                    desc_parts.append(cleaned)
                j += 1
            experiences.append(
                {
                    "company_name": company,
                    "job_title": title_info["job_title"],
                    "start_date": title_info["start_date"],
                    "end_date": title_info["end_date"],
                    "is_current": title_info["is_current"],
                    "description": "\n".join(desc_parts) if desc_parts else None,
                }
            )
            i = j
            continue

        i += 1
    return experiences


def _parse_educations(lines: list[str]) -> list[dict[str, Any]]:
    educations: list[dict[str, Any]] = []
    i = 0
    while i < len(lines):
        line = lines[i]

        from_m = DEGREE_FROM_RE.match(line)
        if from_m:
            start = None
            end = None
            is_current = False
            j = i + 1
            if j < len(lines):
                year_m = YEAR_ONLY_RE.match(lines[j])
                if year_m:
                    start_y = _fix_ocr_year(int(year_m.group("start_year")))
                    start = f"{start_y}-01"
                    end_raw = year_m.group("end_year")
                    is_current = bool(PRESENT_RE.search(end_raw))
                    if not is_current and re.match(r"^\d{4}$", end_raw):
                        end_y = _fix_ocr_year(int(end_raw), start_year=start_y)
                        end = f"{end_y}-01"
                    j += 1
            educations.append(
                {
                    "institution_name": from_m.group("institution").strip(),
                    "degree": from_m.group("degree").strip(),
                    "major": None,
                    "start_date": start,
                    "end_date": end,
                    "is_current": is_current,
                    "description": None,
                }
            )
            i = j
            continue

        org_info = _parse_org_date(line)
        if org_info and (INSTITUTION_HINT.search(org_info["organization"]) or INSTITUTION_HINT.search(line)):
            degree = None
            desc_parts: list[str] = []
            j = i + 1
            if j < len(lines) and DEGREE_HINT.search(lines[j]):
                degree_line = lines[j]
                degree = re.sub(r",\s*\d+(?:\.\d+)?\s*/\s*\d+(?:\.\d+)?\s*$", "", degree_line).strip()
                gpa = re.search(r"(\d+(?:\.\d+)?\s*/\s*\d+(?:\.\d+)?)", degree_line)
                if gpa:
                    desc_parts.append(f"GPA {gpa.group(1)}")
                j += 1
            while j < len(lines) and not _is_entry_boundary(lines[j]) and not DEGREE_HINT.search(lines[j]):
                nxt = lines[j]
                desc_parts.append(nxt)
                j += 1
            educations.append(
                {
                    "institution_name": org_info["organization"],
                    "degree": degree,
                    "major": None,
                    "start_date": org_info["start_date"],
                    "end_date": org_info["end_date"],
                    "is_current": org_info["is_current"],
                    "description": "\n".join(desc_parts) if desc_parts else None,
                }
            )
            i = j
            continue

        m = DEGREE_MONTH_RE.match(line)
        if m:
            dates = _dates_from_match(m)
            degree = m.group("degree").strip(" -–—")
            institution = None
            j = i + 1
            if j < len(lines):
                nxt = lines[j]
                if (
                    not DEGREE_MONTH_RE.match(nxt)
                    and not DEGREE_YEAR_RE.match(nxt)
                    and not DEGREE_FROM_RE.match(nxt)
                    and not DEGREE_HINT.search(nxt)
                    and not _parse_org_date(nxt)
                    and len(nxt) <= 80
                    and not nxt.endswith(".")
                ):
                    institution = _strip_location_suffix(nxt)
                    i = j
            educations.append(
                {
                    "institution_name": institution,
                    "degree": degree,
                    "major": None,
                    "start_date": dates["start_date"],
                    "end_date": dates["end_date"],
                    "is_current": dates["is_current"],
                    "description": None,
                }
            )
            i += 1
            continue

        m = DEGREE_YEAR_RE.match(line)
        if m or (DEGREE_HINT.search(line) and not _parse_org_date(line) and not DEGREE_FROM_RE.match(line)):
            degree = m.group("degree").strip() if m else re.sub(r"\s+\d{4}.*$", "", line).strip()
            degree = re.sub(r",\s*\d+(?:\.\d+)?\s*/\s*\d+(?:\.\d+)?\s*$", "", degree).strip()
            start = f"{m.group('start_year')}-01" if m else None
            end_raw = m.group("end_year") if m else None
            is_current = bool(end_raw and PRESENT_RE.search(str(end_raw)))
            end = None if is_current or not end_raw or not re.match(r"^\d{4}$", str(end_raw)) else f"{end_raw}-01"
            if not m:
                yr = YEAR_RANGE_RE.search(line)
                if yr:
                    start_y = _fix_ocr_year(int(yr.group("start_year")))
                    start = f"{start_y}-01"
                    end_raw = yr.group("end_year")
                    is_current = bool(PRESENT_RE.search(end_raw))
                    if is_current or not re.match(r"^\d{4}$", end_raw):
                        end = None
                    else:
                        end_y = _fix_ocr_year(int(end_raw), start_year=start_y)
                        end = f"{end_y}-01"
            elif start:
                start_y = _fix_ocr_year(int(m.group("start_year")))
                start = f"{start_y}-01"
                if end and re.match(r"^\d{4}", end):
                    end_y = _fix_ocr_year(int(end[:4]), start_year=start_y)
                    end = f"{end_y}-01"

            institution = None
            if i + 1 < len(lines):
                nxt = lines[i + 1]
                if (
                    not DEGREE_HINT.search(nxt)
                    and not DEGREE_YEAR_RE.match(nxt)
                    and not DEGREE_MONTH_RE.match(nxt)
                    and not DEGREE_FROM_RE.match(nxt)
                    and not _parse_org_date(nxt)
                    and not YEAR_ONLY_RE.match(nxt)
                    and len(nxt) <= 80
                ):
                    institution = nxt
                    i += 1
                elif YEAR_ONLY_RE.match(nxt) and not start:
                    year_m = YEAR_ONLY_RE.match(nxt)
                    start_y = _fix_ocr_year(int(year_m.group("start_year")))
                    start = f"{start_y}-01"
                    end_raw = year_m.group("end_year")
                    is_current = bool(PRESENT_RE.search(end_raw))
                    if not is_current and re.match(r"^\d{4}$", end_raw):
                        end = f"{_fix_ocr_year(int(end_raw), start_year=start_y)}-01"
                    i += 1

            educations.append(
                {
                    "institution_name": institution,
                    "degree": degree,
                    "major": None,
                    "start_date": start,
                    "end_date": end,
                    "is_current": is_current,
                    "description": None,
                }
            )
        elif INSTITUTION_HINT.search(line) and educations and not educations[-1].get("institution_name"):
            educations[-1]["institution_name"] = _strip_location_suffix(line)
        i += 1
    return educations


def _parse_skills(lines: list[str]) -> list[str]:
    phrase_map = [
        ("google cloud platform", "Google Cloud Platform"),
        ("google cloud", "Google Cloud"),
        ("time management", "Time Management"),
        ("restful api development", "RESTful API Development"),
        ("restful api", "RESTful API"),
        ("full stack development", "Full Stack Development"),
        ("sql query language", "SQL Query Language"),
        ("node.js", "Node.js"),
        ("vue.js", "Vue.js"),
        ("nuxt.js", "Nuxt.js"),
        ("express.js", "Express.js"),
    ]
    skills: list[str] = []
    for line in lines:
        payload = SKILL_LABEL_RE.sub("", line).strip()
        payload = re.sub(r"^[^:]{1,40}:\s*", "", payload).strip()
        payload = re.sub(r"\(([^)]+)\)", r", \1", payload)
        lower = payload.lower()
        for needle, label in phrase_map:
            if needle in lower:
                skills.append(label)
                payload = re.sub(re.escape(needle), " ", payload, flags=re.I)
                lower = payload.lower()
        if re.search(r"[,|;•]", payload):
            tokens = re.split(r"[,|;•]+|\.\s+(?=[A-Z])", payload)
        else:
            tokens = payload.split()
        for token in tokens:
            token = token.strip(" .")
            if not token or len(token) < 2 or len(token) > 40:
                continue
            if JOB_TITLE_SKILL_BLOCK.match(token):
                continue
            if token.lower() in {
                "languages",
                "language",
                "concepts",
                "tools",
                "frontend",
                "backend",
                "database",
                "programming",
                "hard skills",
                "soft skills",
                "time",
                "management",
                "google",
                "cloud",
                "platform",
                "development",
                "query",
                "language",
            }:
                continue
            skills.append(token)

    seen: set[str] = set()
    unique: list[str] = []
    for s in skills:
        key = s.lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append(s)
    return unique[:60]


def _enrich_skills_from_body(skills: list[str], text: str) -> list[str]:
    """Add tech tokens clearly written in summary/experience but missing from Skills tags."""
    catalog = [
        "Vue.js",
        "Nuxt.js",
        "React",
        "Angular",
        "Express.js",
        "Node.js",
        "Laravel",
        "CodeIgniter",
        "Yii2",
        "PHP",
        "JavaScript",
        "TypeScript",
        "PostgreSQL",
        "MongoDB",
        "MySQL",
        "Docker",
        "Kubernetes",
        "Google Cloud Platform",
    ]
    merged = list(skills)
    seen = {s.lower() for s in merged}
    for token in catalog:
        if token.lower() in seen:
            continue
        if re.search(rf"(?<![A-Za-z0-9]){re.escape(token)}(?![A-Za-z0-9])", text, re.I):
            merged.append(token)
            seen.add(token.lower())
    return merged[:60]


def _extract_name(lines: list[str], profile_lines: list[str]) -> str | None:
    candidates = (profile_lines or lines)[:6]
    for line in candidates:
        if EMAIL_RE.search(line) or PHONE_RE.search(line):
            continue
        if LOCATION_POSTAL_RE.match(line):
            continue
        if SECTION_SUMMARY.match(line) or SECTION_EXPERIENCE.match(line):
            continue
        if re.match(r"^[A-Za-zÀ-ÿ' .\-]{3,80}$", line) and 2 <= len(line.split()) <= 6:
            return line.title() if line.isupper() else line
    return None


def _extract_location(lines: list[str], profile_lines: list[str]) -> str | None:
    for line in (profile_lines or lines)[:8]:
        if LOCATION_POSTAL_RE.match(line):
            return re.sub(r",\s*\d{4,6}\s*$", "", line).strip()
        city_country = re.match(r"^([A-Za-zÀ-ÿ .'-]{3,40}),\s*([A-Za-zÀ-ÿ .'-]{3,40})$", line)
        if city_country and not EMAIL_RE.search(line) and "http" not in line.lower():
            return city_country.group(0)
        if re.search(r"\b(kec\.?|kel\.?|blok|jl\.?|jalan|depok|jakarta|bandung|surabaya)\b", line, re.I):
            cleaned = EMAIL_RE.sub("", line)
            cleaned = PHONE_RE.sub("", cleaned)
            cleaned = re.sub(r"\s+", " ", cleaned).strip(" |,-")
            if len(cleaned) >= 8:
                return cleaned
    contact_line = next((l for l in lines[:5] if EMAIL_RE.search(l) or PHONE_RE.search(l)), "")
    for part in re.split(r"[|•]", contact_line):
        part = part.strip()
        if not part or EMAIL_RE.search(part) or PHONE_RE.search(part):
            continue
        if "github" in part.lower() or "linkedin" in part.lower() or "http" in part.lower():
            continue
        if re.match(r"^[A-Za-zÀ-ÿ .,\-]{3,60}$", part):
            return part
    # Email/phone/address jammed on one OCR line without pipes.
    if contact_line:
        remainder = EMAIL_RE.sub(" ", contact_line)
        remainder = PHONE_RE.sub(" ", remainder)
        remainder = re.sub(r"https?://\S+", " ", remainder, flags=re.I)
        remainder = re.sub(
            r"\b(?:github|linkedin|gitlab|bitbucket)\.com/\S+",
            " ",
            remainder,
            flags=re.I,
        )
        remainder = re.sub(r"\bwww\.\S+", " ", remainder, flags=re.I)
        remainder = re.sub(r"[|•]+", " ", remainder)
        remainder = re.sub(r"\s+", " ", remainder).strip(" |,-")
        if (
            len(remainder) >= 8
            and re.search(r"[A-Za-zÀ-ÿ]", remainder)
            and "github" not in remainder.lower()
            and "linkedin" not in remainder.lower()
        ):
            return remainder
    return None


def _extract_summary(sections: dict[str, list[str]]) -> str | None:
    summary_lines = sections.get("summary") or []
    if summary_lines:
        text = " ".join(summary_lines).strip()
        return text or None

    # Some CVs put the bio in the profile block without a "Summary" heading.
    profile_lines = sections.get("profile") or []
    bio_parts: list[str] = []
    for line in profile_lines:
        if EMAIL_RE.search(line) or PHONE_RE.search(line):
            continue
        if LOCATION_POSTAL_RE.match(line):
            continue
        if re.match(r"^[A-Za-zÀ-ÿ' .\-]{3,80}$", line) and len(line.split()) <= 6:
            continue  # likely the name line
        if "http" in line.lower() or "linkedin" in line.lower() or "github" in line.lower():
            continue
        if len(line) >= 80:
            bio_parts.append(line)
    if bio_parts:
        return " ".join(bio_parts).strip()
    return None


def _has_cv_sections(lines: list[str]) -> bool:
    return any(
        SECTION_EXPERIENCE.match(line)
        or SECTION_EDUCATION.match(line)
        or SECTION_SKILLS.match(line)
        or SECTION_SUMMARY.match(line)
        for line in lines
    )


def _is_cover_letter(text: str, lines: list[str]) -> bool:
    if _has_cv_sections(lines):
        return False
    hits = len(COVER_LETTER_RE.findall(text))
    return hits >= 2


def _parse_from_text(text: str, *, source: str = "text") -> dict[str, Any]:
    text = str(text or "").replace("\u00a0", " ").strip()
    if not text:
        raise ValueError("No extractable text from file")

    lines = [line for line in _normalize_lines(text) if line]
    if _is_cover_letter(text, lines):
        email_m = EMAIL_RE.search(text)
        phone_m = PHONE_RE.search(text)
        profile_lines = lines[:12]
        return {
            "personal_info": {
                "full_name": _extract_name(lines, profile_lines),
                "email": email_m.group(0) if email_m else None,
                "phone": re.sub(r"[\s()-]", "", phone_m.group(0)) if phone_m else None,
                "location": _extract_location(lines, profile_lines),
                "summary": None,
            },
            "work_experiences": [],
            "educations": [],
            "skills": [],
            "_meta": {
                "parser": "python_fallback",
                "engine": "cover_letter_heuristics",
                "document_type": "cover_letter",
                "source": source,
            },
        }

    sections = _split_sections(lines)

    email_m = EMAIL_RE.search(text)
    phone_m = PHONE_RE.search(text)
    full_name = _extract_name(lines, sections.get("profile", []))
    location = _extract_location(lines, sections.get("profile", []))
    summary = _extract_summary(sections)

    work = _parse_experiences(sections.get("experience", []))
    projects = _parse_experiences(sections.get("projects", []))
    combined_work = (work + projects)[:10]
    education = _parse_educations(sections.get("education", []))
    skills = _enrich_skills_from_body(
        _parse_skills(sections.get("skills", [])),
        text,
    )

    return {
        "personal_info": {
            "full_name": full_name,
            "email": email_m.group(0) if email_m else None,
            "phone": re.sub(r"[\s()-]", "", phone_m.group(0)) if phone_m else None,
            "location": location,
            "summary": summary,
        },
        "work_experiences": combined_work,
        "educations": education[:6],
        "skills": skills,
        "_meta": {
            "parser": "python_fallback",
            "engine": "pdfplumber+heuristics",
            "document_type": "resume",
            "source": source,
            "sections_detected": [k for k, v in sections.items() if v and k != "profile"],
            "work_count": len(work),
            "project_count": len(projects),
        },
    }


def _parse_with_fallback(path: str) -> dict[str, Any]:
    return _parse_from_text(_extract_text(path), source=os.path.basename(path))


def _map_resume_parser_package(raw: dict[str, Any]) -> dict[str, Any]:
    titles = raw.get("designition") or raw.get("designation") or []
    companies = raw.get("Companies worked at") or raw.get("companies") or []
    universities = raw.get("university") or []
    degrees = raw.get("degree") or []
    skills = raw.get("skills") or []

    if isinstance(titles, str):
        titles = [titles]
    if isinstance(companies, str):
        companies = [companies]
    if isinstance(universities, str):
        universities = [universities]
    if isinstance(degrees, str):
        degrees = [degrees]
    if isinstance(skills, str):
        skills = [s.strip() for s in skills.split(",") if s.strip()]

    work = []
    count = max(len(titles), len(companies), 1 if titles or companies else 0)
    for i in range(count):
        work.append(
            {
                "company_name": companies[i] if i < len(companies) else None,
                "job_title": titles[i] if i < len(titles) else None,
                "start_date": None,
                "end_date": None,
                "is_current": False,
                "description": None,
            }
        )

    educations = []
    edu_count = max(len(universities), len(degrees), 1 if universities or degrees else 0)
    for i in range(edu_count):
        educations.append(
            {
                "institution_name": universities[i] if i < len(universities) else None,
                "degree": degrees[i] if i < len(degrees) else None,
                "major": None,
                "start_date": None,
                "end_date": None,
                "is_current": False,
                "description": None,
            }
        )

    phone = raw.get("phone")
    if isinstance(phone, list):
        phone = phone[0] if phone else None

    return {
        "personal_info": {
            "full_name": raw.get("name"),
            "email": raw.get("email"),
            "phone": str(phone).replace(" ", "") if phone else None,
            "location": None,
        },
        "work_experiences": [w for w in work if w.get("company_name") or w.get("job_title")],
        "educations": [e for e in educations if e.get("institution_name") or e.get("degree")],
        "skills": [str(s).strip() for s in skills if str(s).strip()][:60],
        "_meta": {
            "parser": "python_resume_parser",
            "engine": "resume-parser",
            "total_exp": raw.get("total_exp"),
        },
    }


def _parse_with_package(path: str) -> dict[str, Any]:
    from resume_parser import resumeparse

    raw = resumeparse.read_file(path)
    return _map_resume_parser_package(raw)


def _is_thin(result: dict[str, Any]) -> bool:
    if (result.get("_meta") or {}).get("document_type") == "cover_letter":
        return False
    personal = result.get("personal_info") or {}
    score = 0
    if personal.get("full_name"):
        score += 1
    if personal.get("email") or personal.get("phone"):
        score += 1
    if result.get("work_experiences"):
        score += 2
    if result.get("educations"):
        score += 1
    if result.get("skills"):
        score += 1
    return score < 3


def main() -> None:
    if len(sys.argv) < 2:
        _emit(
            {
                "error": (
                    "Usage: cv_parse_python.py <file_path> "
                    "| cv_parse_python.py --extract-text <file_path> "
                    "| cv_parse_python.py --from-text <text_file> "
                    "| cv_parse_python.py --render-pages <file_path> [--max-pages N] [--dpi N]"
                )
            },
            1,
        )

    if sys.argv[1] == "--render-pages":
        if len(sys.argv) < 3:
            _emit({"error": "Usage: cv_parse_python.py --render-pages <file_path>"}, 1)
        path = os.path.abspath(sys.argv[2])
        if not os.path.isfile(path):
            _emit({"error": f"File not found: {path}"}, 1)
        max_pages = 3
        dpi = 150
        args = sys.argv[3:]
        i = 0
        while i < len(args):
            if args[i] == "--max-pages" and i + 1 < len(args):
                max_pages = int(args[i + 1])
                i += 2
                continue
            if args[i] == "--dpi" and i + 1 < len(args):
                dpi = int(args[i + 1])
                i += 2
                continue
            _emit({"error": f"Unknown argument: {args[i]}"}, 1)
        try:
            _emit(_render_pdf_pages(path, max_pages=max_pages, resolution=dpi), 0)
        except Exception as err:
            _emit(_error_payload(err, prefix="Failed to render PDF pages"), 1)

    if sys.argv[1] == "--from-text":
        if len(sys.argv) < 3:
            _emit({"error": "Usage: cv_parse_python.py --from-text <text_file>", "error_type": "UsageError"}, 1)
        text_path = os.path.abspath(sys.argv[2])
        if not os.path.isfile(text_path):
            _emit({"error": f"File not found: {text_path}", "error_type": "FileNotFoundError"}, 1)
        try:
            with open(text_path, "r", encoding="utf-8", errors="replace") as handle:
                text = handle.read()
            _emit(_parse_from_text(text, source=os.path.basename(text_path)), 0)
        except Exception as err:
            _emit(_error_payload(err), 1)

    if sys.argv[1] == "--extract-text":
        if len(sys.argv) < 3:
            _emit({"error": "Usage: cv_parse_python.py --extract-text <file_path>", "error_type": "UsageError"}, 1)
        path = os.path.abspath(sys.argv[2])
        if not os.path.isfile(path):
            _emit({"error": f"File not found: {path}", "error_type": "FileNotFoundError"}, 1)
        try:
            _emit({"text": _extract_text(path)}, 0)
        except Exception as err:
            _emit(_error_payload(err, prefix="Failed to extract text"), 1)

    path = os.path.abspath(sys.argv[1])
    if not os.path.isfile(path):
        _emit({"error": f"File not found: {path}", "error_type": "FileNotFoundError"}, 1)

    # Structured pdfplumber heuristics are more reliable than the broken spaCy-2 package
    # on modern Python. Try package only if heuristics are thin.
    fallback_err = None
    try:
        result = _parse_with_fallback(path)
        if (result.get("_meta") or {}).get("document_type") == "cover_letter" or not _is_thin(result):
            _emit(result, 0)
    except Exception as err:
        result = None
        fallback_err = err

    try:
        package_result = _parse_with_package(path)
        if result is None or _is_thin(result) or (
            len(package_result.get("work_experiences") or []) > len(result.get("work_experiences") or [])
        ):
            _emit(package_result, 0)
        _emit(result, 0)
    except Exception as package_err:
        if result is not None:
            result.setdefault("_meta", {})["package_error"] = str(package_err)
            _emit(result, 0)
        payload = _error_payload(fallback_err or package_err)
        payload["package_error"] = str(package_err)
        if fallback_err is not None and package_err is not fallback_err:
            payload["fallback_error"] = str(fallback_err)
            payload["fallback_error_type"] = fallback_err.__class__.__name__
        _emit(payload, 1)


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as err:
        _emit(_error_payload(err, prefix="Unhandled Python CV parser error"), 1)
