# CV Parser Sidecar

Standalone Python HTTP service for CV text extraction / parsing / PDF page render.
Keeps Python deps **out of** the Node backend Docker image. Run it with **PM2 on the VPS**.

## Endpoints

| Method | Path | Body |
|--------|------|------|
| `GET` | `/health` | — |
| `POST` | `/v1/extract-text` | JSON `{file_base64,filename}` or multipart `file` |
| `POST` | `/v1/parse` | same, or `{text}` for OCR text |
| `POST` | `/v1/render-pages` | PDF → `{images_base64:[...]}` |

Auth (optional): set `CV_PARSER_SERVICE_TOKEN` and send `Authorization: Bearer <token>`.

## VPS setup (PM2)

```bash
# 1) Repo root on the VPS
cd /var/www/cari-kerja/be-stage-cari-kerja

# 2) Python venv + deps
python3 -m venv .venv-cv
.venv-cv/bin/pip install -U pip
.venv-cv/bin/pip install -r services/cv-parser/requirements.txt

# 3) Env for the sidecar
cp services/cv-parser/.env.example services/cv-parser/.env
# edit CV_PARSER_SERVICE_TOKEN (same value as backend)

# 4) Log dir used by ecosystem.config.cjs
mkdir -p logs

# 5) Start with PM2
export CV_PARSER_SERVICE_TOKEN=change-me   # or rely on services/cv-parser/.env
pm2 start services/cv-parser/ecosystem.config.cjs
pm2 save
pm2 startup   # follow printed instructions once

# 6) Health check
curl -s http://127.0.0.1:5101/health
# {"ok":true,"service":"cv-parser"}
```

Useful PM2 commands:

```bash
pm2 status cv-parser
pm2 logs cv-parser
pm2 restart cv-parser
pm2 stop cv-parser
```

Custom venv path:

```bash
CV_PARSER_PYTHON=/opt/cv-parser/.venv/bin/python \
  pm2 start services/cv-parser/ecosystem.config.cjs
```

## Backend `.env` (Node / Docker)

```env
CV_USE_PYTHON_RESUME_PARSER=true
# From container → host (Docker Desktop / Compose extra_hosts):
CV_PARSER_SERVICE_URL=http://host.docker.internal:5101
# Linux Docker without host.docker.internal — use bridge gateway, e.g.:
# CV_PARSER_SERVICE_URL=http://172.17.0.1:5101
CV_PARSER_SERVICE_TOKEN=change-me
CV_PYTHON_STRICT=true
# Do NOT set CV_PYTHON_BIN when using the sidecar
```

If the API container cannot reach the host, put the sidecar on the same compose network and use its DNS name (`http://cv-parser:5101`).

## Local Node (no Docker)

Either:

1. Start the sidecar and set `CV_PARSER_SERVICE_URL=http://127.0.0.1:5101`, or
2. Leave `CV_PARSER_SERVICE_URL` unset and use local spawn via `CV_PYTHON_BIN` + `requirements-cv-parser.txt`.

## Manual run (no PM2)

```bash
cd /path/to/be-dev
.venv-cv/bin/python services/cv-parser/server.py
```

The process cwd must be the **repo root** so `scripts/cv_parse_python.py` resolves.
