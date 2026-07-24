#!/usr/bin/env python3
"""
Standalone CV parser HTTP sidecar.

Runs outside the Node backend Docker image so the API container stays Node-only.
Reuses scripts/cv_parse_python.py heuristics. Prefer PM2 on VPS:

  pm2 start services/cv-parser/ecosystem.config.cjs

Manual:
  python -m venv .venv-cv && .venv-cv/bin/pip install -r services/cv-parser/requirements.txt
  .venv-cv/bin/python services/cv-parser/server.py

Env (or services/cv-parser/.env):
  CV_PARSER_HOST=0.0.0.0
  CV_PARSER_PORT=5101
  CV_PARSER_SERVICE_TOKEN=optional-shared-secret
  CV_PARSER_THREADS=4
"""

from __future__ import annotations

import base64
import importlib.util
import os
import tempfile
import traceback
from pathlib import Path

from flask import Flask, jsonify, request

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "cv_parse_python.py"


def _load_dotenv():
    """Optional local .env next to this file (does not override existing env)."""
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.is_file():
        return
    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        if not key or key in os.environ:
            continue
        os.environ[key] = value.strip().strip('"').strip("'")


_load_dotenv()


def _load_parser():
    if not SCRIPT.is_file():
        raise FileNotFoundError(f"Parser script not found: {SCRIPT}")
    spec = importlib.util.spec_from_file_location("cv_parse_python", SCRIPT)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load parser module from {SCRIPT}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


cv = _load_parser()

app = Flask(__name__)


def _service_token():
    return (os.environ.get("CV_PARSER_SERVICE_TOKEN") or "").strip()


def _unauthorized():
    return jsonify({"error": "Unauthorized", "error_type": "Unauthorized"}), 401


def _check_auth():
    expected = _service_token()
    if not expected:
        return None
    header = request.headers.get("Authorization") or ""
    token = request.headers.get("X-CV-Parser-Token") or ""
    if header.startswith("Bearer "):
        token = header[7:].strip() or token
    if token != expected:
        return _unauthorized()
    return None


def _error_response(err: BaseException, prefix: str | None = None, status: int = 400):
    payload = cv._error_payload(err, prefix=prefix)
    return jsonify(payload), status


def _write_temp_file(filename: str, raw: bytes) -> str:
    suffix = Path(filename or "upload.bin").suffix or ".bin"
    fd, path = tempfile.mkstemp(prefix="cv_sidecar_", suffix=suffix)
    os.close(fd)
    with open(path, "wb") as handle:
        handle.write(raw)
    return path


def _read_body_file() -> tuple[str | None, bytes | None, str | None]:
    """
    Accept either multipart `file` or JSON:
      { "filename": "cv.pdf", "file_base64": "..." }
      { "text": "..." }
    Returns (filename, bytes, text).
    """
    if request.is_json:
        body = request.get_json(silent=True) or {}
        text = body.get("text")
        if isinstance(text, str) and text.strip():
            return None, None, text
        b64 = body.get("file_base64") or body.get("content_base64")
        if not b64:
            return None, None, None
        raw = base64.b64decode(b64)
        filename = body.get("filename") or "upload.bin"
        return str(filename), raw, None

    upload = request.files.get("file")
    if upload and upload.filename:
        return upload.filename, upload.read(), None

    return None, None, None


@app.get("/health")
def health():
    return jsonify({"ok": True, "service": "cv-parser"})


@app.post("/v1/extract-text")
def extract_text():
    denied = _check_auth()
    if denied:
        return denied
    tmp = None
    try:
        filename, raw, text = _read_body_file()
        if text is not None:
            return jsonify({"text": text})
        if not raw:
            return jsonify({"error": "file or file_base64 required", "error_type": "ValidationError"}), 400
        tmp = _write_temp_file(filename or "upload.bin", raw)
        return jsonify({"text": cv._extract_text(tmp)})
    except Exception as err:
        return _error_response(err, prefix="Failed to extract text")
    finally:
        if tmp:
            try:
                os.unlink(tmp)
            except OSError:
                pass


@app.post("/v1/parse")
def parse_cv():
    denied = _check_auth()
    if denied:
        return denied
    tmp = None
    try:
        filename, raw, text = _read_body_file()
        if text is not None:
            result = cv._parse_from_text(text, source="remote-text")
            return jsonify(result)
        if not raw:
            return jsonify({"error": "file, file_base64, or text required", "error_type": "ValidationError"}), 400
        tmp = _write_temp_file(filename or "upload.bin", raw)
        # Prefer file-based parse (pdfplumber layout) for digital PDFs/DOCX.
        result = cv._parse_with_fallback(tmp)
        return jsonify(result)
    except Exception as err:
        return _error_response(err, prefix="Failed to parse CV")
    finally:
        if tmp:
            try:
                os.unlink(tmp)
            except OSError:
                pass


@app.post("/v1/render-pages")
def render_pages():
    denied = _check_auth()
    if denied:
        return denied
    tmp = None
    try:
        filename, raw, _text = _read_body_file()
        if not raw:
            return jsonify({"error": "file or file_base64 required", "error_type": "ValidationError"}), 400
        max_pages = 3
        dpi = 150
        if request.is_json:
            body = request.get_json(silent=True) or {}
            max_pages = int(body.get("max_pages") or max_pages)
            dpi = int(body.get("dpi") or dpi)
        else:
            max_pages = int(request.args.get("max_pages") or request.form.get("max_pages") or max_pages)
            dpi = int(request.args.get("dpi") or request.form.get("dpi") or dpi)
        tmp = _write_temp_file(filename or "upload.pdf", raw)
        rendered = cv._render_pdf_pages(tmp, max_pages=max_pages, resolution=dpi)
        images_b64 = []
        for image_path in rendered.get("images") or []:
            try:
                with open(image_path, "rb") as handle:
                    images_b64.append(base64.b64encode(handle.read()).decode("ascii"))
            finally:
                try:
                    os.unlink(image_path)
                except OSError:
                    pass
        return jsonify(
            {
                "images_base64": images_b64,
                "page_count": rendered.get("page_count"),
                "rendered": len(images_b64),
                "resolution": rendered.get("resolution"),
            }
        )
    except Exception as err:
        return _error_response(err, prefix="Failed to render PDF pages")
    finally:
        if tmp:
            try:
                os.unlink(tmp)
            except OSError:
                pass


@app.errorhandler(Exception)
def on_error(err):
    traceback.print_exc()
    return _error_response(err, prefix="Unhandled CV parser service error", status=500)


def main():
    host = os.environ.get("CV_PARSER_HOST", "0.0.0.0")
    port = int(os.environ.get("CV_PARSER_PORT", "5101"))
    threads = max(1, int(os.environ.get("CV_PARSER_THREADS", "4")))

    print(f"cv-parser listening on {host}:{port} (threads={threads})", flush=True)
    try:
        from waitress import serve

        serve(app, host=host, port=port, threads=threads)
    except ImportError:
        print("waitress not installed; falling back to Flask development server", flush=True)
        app.run(host=host, port=port, threaded=True)


if __name__ == "__main__":
    main()
