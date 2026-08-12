/**
 * Object storage facade: local disk (default) or S3-compatible (MinIO / R2 / S3).
 *
 * Stored value formats:
 *   - local: `/uploads/...`
 *   - s3:    `s3:<object-key>`  e.g. `s3:resumes/resume-123.pdf`
 *   - r2:    `r2:<object-key>`  (legacy; still resolved)
 */

const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");
const s3 = require("../databases/s3_compatible/oss");

const ctx = "Object-Storage";
const S3_PREFIX = "s3:";
const R2_PREFIX = "r2:"; // legacy refs written before MinIO switch

const OBJECT_DRIVERS = new Set(["minio", "r2", "s3"]);

const getDriver = () => {
  const explicit = String(process.env.STORAGE_DRIVER || "local").toLowerCase();
  if (OBJECT_DRIVERS.has(explicit)) {
    if (!s3.isConfigured()) {
      logger.error(
        ctx,
        "getDriver",
        `STORAGE_DRIVER=${explicit} but credentials missing; using local`
      );
      return "local";
    }
    return explicit;
  }
  return "local";
};

const isObjectDriver = () => OBJECT_DRIVERS.has(getDriver());

/** @deprecated Use isObjectStored */
const isR2Driver = () => {
  const d = getDriver();
  return d === "r2" || d === "minio" || d === "s3";
};

const isObjectStored = (value) =>
  typeof value === "string" &&
  (value.startsWith(S3_PREFIX) || value.startsWith(R2_PREFIX));

/** @deprecated Use isObjectStored */
const isR2Stored = isObjectStored;

const toStoredRef = (key) => `${S3_PREFIX}${key}`;

const keyFromStored = (value) => {
  if (typeof value !== "string") return null;
  if (value.startsWith(S3_PREFIX)) return value.slice(S3_PREFIX.length);
  if (value.startsWith(R2_PREFIX)) return value.slice(R2_PREFIX.length);
  return null;
};

const publicBaseUrl = () => {
  const cfg = s3.getActiveConfig();
  const base =
    process.env.MINIO_PUBLIC_BASE_URL ||
    process.env.R2_PUBLIC_BASE_URL ||
    process.env.S3_PUBLIC_BASE_URL ||
    cfg?.publicBaseUrl ||
    "";
  return String(base).replace(/\/$/, "");
};

const hasPublicBaseUrl = () => Boolean(publicBaseUrl());

/**
 * Persist a multer disk file. When MinIO/R2/S3 is active, upload then remove local temp.
 * @returns {Promise<string>} stored URL/ref for DB
 */
const persistUploadedFile = async (file, { folder }) => {
  if (!file?.filename || !file?.path) {
    throw new Error("Missing uploaded file");
  }

  if (!isObjectDriver()) {
    return `/uploads/${folder}/${file.filename}`;
  }

  const key = `${folder}/${file.filename}`;
  const upload = await s3.uploadLocalFile({
    localPath: file.path,
    key,
    contentType: file.mimetype,
  });

  if (upload.err) {
    throw new Error(upload.err.message || upload.err || "Object storage upload failed");
  }

  try {
    fs.unlinkSync(file.path);
  } catch (err) {
    logger.error(ctx, "persistUploadedFile unlink", err.message || err);
  }

  return toStoredRef(key);
};

/**
 * Resolve a stored ref to a usable URL for clients.
 * - local paths returned as-is
 * - public assets prefer PUBLIC_BASE_URL when signed=false
 * - sensitive docs use signed URL when signed=true
 */
const resolveUrl = async (
  stored,
  { signed = false, expiresInSeconds = 60 * 60 } = {}
) => {
  if (!stored) return null;
  if (!isObjectStored(stored)) return stored;

  const key = keyFromStored(stored);
  if (!signed) {
    const base = publicBaseUrl();
    if (base) return `${base}/${key}`;
  }

  const signedResult = await s3.getSignedUrl(key, expiresInSeconds);
  if (signedResult.err) {
    logger.error(ctx, "resolveUrl signed", signedResult.err);
    return null;
  }
  return signedResult.data.url;
};

const deleteStored = async (stored) => {
  if (!stored) return;
  if (!isObjectStored(stored)) {
    if (typeof stored === "string" && stored.startsWith("/uploads/")) {
      const uploadsRoot = process.env.UPLOADS_PATH
        ? path.resolve(process.env.UPLOADS_PATH)
        : path.join(__dirname, "../../uploads");
      const localPath = path.join(
        uploadsRoot,
        stored.replace(/^\/uploads\//, "")
      );
      try {
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      } catch (err) {
        logger.error(ctx, "deleteStored local", err.message || err);
      }
    }
    return;
  }

  const key = keyFromStored(stored);
  await s3.deleteObjectStream(key);
};

module.exports = {
  getDriver,
  isObjectDriver,
  isR2Driver,
  isObjectStored,
  isR2Stored,
  toStoredRef,
  keyFromStored,
  hasPublicBaseUrl,
  publicBaseUrl,
  persistUploadedFile,
  resolveUrl,
  deleteStored,
};
