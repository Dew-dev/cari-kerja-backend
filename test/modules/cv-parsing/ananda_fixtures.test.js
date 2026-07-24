/**
 * Regression: known Ananda CV fixtures must keep accurate structure.
 * Skips when sample files are not present in the repo root.
 */
process.env.CV_USE_RESUME_PARSER = "false";
process.env.CV_USE_OPENRESUME_STYLE = "false";
process.env.CV_USE_PYTHON_RESUME_PARSER = "true";
process.env.CV_OCR_ENABLED = "true";
delete process.env.CV_PARSER_AI_URL;
delete process.env.CV_PARSER_AI_KEY;
delete process.env.CV_PARSER_SERVICE_URL; // force local spawn in fixture tests

const fs = require("fs");
const path = require("path");
const { parseCV } = require("../../../src/modules/cv-parsing/services/cv_parser");

const ROOT = path.resolve(__dirname, "../../..");
const DIGITAL_CV = path.join(ROOT, "Ananda_Dewa_CV.pdf");
const SCANNED_CV = path.join(ROOT, "Ananda Dewa Nur Widiantoro.pdf");

function companies(parsed) {
  return (parsed.work_experiences || []).map((w) => w.company_name);
}

describe("cv-parsing ananda fixtures", () => {
  const maybe = fs.existsSync(DIGITAL_CV) ? it : it.skip;

  maybe(
    "parses digital Ananda_Dewa_CV.pdf with title/company pairing intact",
    async () => {
      const parsed = await parseCV(DIGITAL_CV, "application/pdf");
      expect(parsed.personal_info?.full_name || parsed.name).toMatch(/Ananda Dewa/i);
      expect(parsed.personal_info?.email || parsed.email).toMatch(/dewdewd22@gmail\.com/i);
      expect(companies(parsed)).toEqual([
        "EGI Resources",
        "PT. Novell Pharmaceutical Company",
        "Maxxima Innovative Engineering",
      ]);
      expect(parsed.work_experiences.map((w) => w.job_title)).toEqual([
        "Full Stack Developer",
        "Programmer",
        "Programmer",
      ]);
      const institutions = (parsed.educations || []).map((e) => e.institution_name);
      expect(institutions).toEqual(expect.arrayContaining(["STTI NIIT I-TECH", "CCIT FTUI"]));
      expect(parsed.skills.join(" ")).toMatch(/Vue\.js/i);
      expect(parsed.skills.join(" ")).toMatch(/PHP|Laravel/i);
      expect(parsed._meta?.extraction_method).toBe("digital");
      expect((parsed.summary || parsed.personal_info?.summary || "").length).toBeGreaterThan(200);
    },
    120000
  );

  const maybeScan = fs.existsSync(SCANNED_CV) ? it : it.skip;

  maybeScan(
    "parses scanned Ananda Dewa Nur Widiantoro.pdf via OCR heuristics",
    async () => {
      const parsed = await parseCV(SCANNED_CV, "application/pdf");
      expect(parsed.personal_info?.full_name || parsed.name).toMatch(/Ananda Dewa/i);
      expect(companies(parsed)).toEqual([
        "EGI Resources",
        "PT. Novell Pharmaceutical Company",
        "Maxxima Innovative Engineering",
      ]);
      expect(["tesseract", "vision"]).toContain(parsed._meta?.extraction_method);
      expect((parsed.summary || parsed.personal_info?.summary || "").length).toBeGreaterThan(200);
    },
    180000
  );
});
