# Deploy & CI/CD (cari-kerja-backend)

## Environments

| Branch | Environment | VPS path | Docker service | Public URL |
|--------|-------------|---------|----------------|------------|
| `develop` | Staging | `/var/www/cari-kerja/be-stage-cari-kerja` | `be-stage` | https://be-stage.cari-kerja.co.id |
| `main` | Production | `/var/www/cari-kerja/be-prod-cari-kerja` | `be-prod` | https://api.cari-kerja.co.id |

Production auto-deploy is **not** enabled yet. Staging deploys automatically after merge/push to `develop`.

Runtime for the API is **Docker Compose** (shared file on the VPS: `/var/www/cari-kerja/docker-compose.yml`). The CV parser sidecar stays on **PM2** and is not part of this workflow.

## Pipelines

### CI — `.github/workflows/ci.yml`

- Runs on pull requests targeting `develop` or `main`
- Node 22 → `npm ci` → `npm test`

### CD staging — `.github/workflows/deploy-staging.yml`

- Runs on push to `develop` and via **Actions → Deploy Staging → Run workflow**
- SSHs into the VPS and runs [`scripts/deploy/staging-be-remote.sh`](../scripts/deploy/staging-be-remote.sh):
  1. `git pull` on `be-stage-cari-kerja` (`develop`)
  2. `docker compose up -d --build be-stage`
  3. Soft `docker image prune -f` (no aggressive `-a` prune)
  4. Health check `GET /api/v1/health`

SQL migrations are **not** auto-applied. Run them manually on the staging DB when a release needs them.

## One-time GitHub + VPS setup

### 1. SSH deploy key (recommended)

On your laptop (do **not** commit the private key):

```bash
ssh-keygen -t ed25519 -C "github-actions-cari-kerja-be-staging" -f ./cari-kerja-be-staging-deploy -N ""
```

On the VPS (as the deploy user, usually `root`):

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "ssh-ed25519 AAAA... github-actions-cari-kerja-be-staging" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Confirm the VPS can still `git pull` the backend repo (deploy key / machine key for GitHub already in use under `/var/www/cari-kerja/be-stage-cari-kerja`).

### 2. GitHub Secrets (repository secrets)

Repo → **Settings → Secrets and variables → Actions** → **New repository secret**.

The deploy workflow reads **repository secrets** only (no GitHub Environment required), so collaborators who can manage Actions secrets can finish setup without Environments access.

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | VPS hostname or IP |
| `VPS_PORT` | SSH port (usually `22`) |
| `VPS_USER` | SSH user (usually `root`) |
| `VPS_SSH_PRIVATE_KEY` | Full private key PEM contents (`cari-kerja-be-staging-deploy`) |

### 3. Smoke test

1. Merge this CI/CD branch into `develop`, **or** run **Deploy Staging** manually after secrets exist.
2. Confirm Actions job is green.
3. `curl -sS https://be-stage.cari-kerja.co.id/api/v1/health`

## Local / manual deploy (ops)

On the VPS:

```bash
bash /var/www/cari-kerja/be-stage-cari-kerja/scripts/deploy/staging-be-remote.sh
```

The older all-in-one script `/var/www/cari-kerja/deploy-stage.sh` still rebuilds FE + super-admin + BE together; prefer the backend-only script for API releases.

## Docker notes

- Image builds from the service context `./be-stage-cari-kerja` using the repo `Dockerfile`.
- App listens on `APP_PORT` from the VPS `.env` (staging: `5001`).
- Compose currently bind-mounts the host checkout at `/var/www` inside the container for uploads (`UPLOADS_PATH`). Follow-up improvement: mount only `uploads/` instead of the whole tree.
- Do not put `.env` in git. Keep secrets only on the VPS `env_file` and in GitHub Secrets for SSH.

## Production (later)

When the product is ready, mirror this flow for `main` → `be-prod` (port `5000`, `api.cari-kerja.co.id`) with a separate workflow and stronger approvals. Do not reuse the staging deploy key for production if you can avoid it.
