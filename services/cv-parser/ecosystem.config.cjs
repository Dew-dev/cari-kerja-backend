/**
 * PM2 process file for the CV parser sidecar.
 *
 * From repo root on the VPS:
 *   pm2 start services/cv-parser/ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup
 *
 * Override paths via env before start, or edit interpreter/cwd below.
 */
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const VENV_PYTHON =
  process.env.CV_PARSER_PYTHON ||
  path.join(REPO_ROOT, ".venv-cv", "bin", "python");

module.exports = {
  apps: [
    {
      name: "cv-parser",
      script: path.join(__dirname, "server.py"),
      interpreter: VENV_PYTHON,
      cwd: REPO_ROOT,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      kill_timeout: 10000,
      env: {
        CV_PARSER_HOST: process.env.CV_PARSER_HOST || "0.0.0.0",
        CV_PARSER_PORT: process.env.CV_PARSER_PORT || "5101",
        CV_PARSER_SERVICE_TOKEN: process.env.CV_PARSER_SERVICE_TOKEN || "",
        CV_PARSER_THREADS: process.env.CV_PARSER_THREADS || "4",
      },
      error_file: path.join(REPO_ROOT, "logs", "cv-parser-error.log"),
      out_file: path.join(REPO_ROOT, "logs", "cv-parser-out.log"),
      merge_logs: true,
      time: true,
    },
  ],
};
