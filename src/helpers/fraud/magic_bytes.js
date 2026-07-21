const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

const ctx = "Magic-Bytes";

const SIGNATURES = {
  jpeg: [Buffer.from([0xff, 0xd8, 0xff])],
  png: [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  pdf: [Buffer.from("%PDF")],
  // ZIP container (also DOCX / some portfolios)
  zip: [Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from([0x50, 0x4b, 0x05, 0x06])],
};

const MIME_TO_KINDS = {
  "image/jpeg": ["jpeg"],
  "image/jpg": ["jpeg"],
  "image/png": ["png"],
  "application/pdf": ["pdf"],
  "application/zip": ["zip"],
  "application/x-zip-compressed": ["zip"],
  "application/msword": ["zip"], // old .doc often OLE; allow zip miss → reject unless OLE
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["zip"],
};

const matchesAny = (buf, signatures) =>
  signatures.some((sig) => buf.length >= sig.length && buf.subarray(0, sig.length).equals(sig));

/**
 * Validate magic bytes of a file on disk against expected kinds.
 * @returns {{ ok: boolean, reason?: string }}
 */
const validateFileMagicBytes = (filePath, kinds = []) => {
  try {
    const fd = fs.openSync(filePath, "r");
    const buf = Buffer.alloc(16);
    fs.readSync(fd, buf, 0, 16, 0);
    fs.closeSync(fd);

    for (const kind of kinds) {
      const sigs = SIGNATURES[kind];
      if (sigs && matchesAny(buf, sigs)) return { ok: true };
    }

    // Legacy DOC is OLE compound (D0 CF 11 E0)
    if (kinds.includes("ole")) {
      const ole = Buffer.from([0xd0, 0xcf, 0x11, 0xe0]);
      if (matchesAny(buf, [ole])) return { ok: true };
    }

    return { ok: false, reason: "File content does not match declared type" };
  } catch (err) {
    logger.error(ctx, "validateFileMagicBytes", err.message);
    return { ok: false, reason: "Unable to validate uploaded file" };
  }
};

const kindsForMime = (mimetype, originalname = "") => {
  const fromMime = MIME_TO_KINDS[mimetype] || [];
  const ext = path.extname(originalname || "").toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return ["jpeg"];
  if (ext === ".png") return ["png"];
  if (ext === ".pdf") return ["pdf"];
  if (ext === ".docx" || ext === ".zip") return ["zip"];
  if (ext === ".doc") return ["ole", "zip"];
  return fromMime.length ? fromMime : [];
};

/**
 * Express middleware after multer.single / .array.
 * Deletes invalid file and returns 400.
 */
const validateUploadedMagicBytes = () => (req, res, next) => {
  const files = [];
  if (req.file) files.push(req.file);
  if (Array.isArray(req.files)) files.push(...req.files);

  for (const file of files) {
    const kinds = kindsForMime(file.mimetype, file.originalname);
    if (!kinds.length) {
      try {
        fs.unlinkSync(file.path);
      } catch (_) {}
      return res.status(400).send({
        success: false,
        data: "",
        message: "CONTENT_REJECTED: Unsupported upload type",
        code: 400,
      });
    }

    const check = validateFileMagicBytes(file.path, kinds);
    if (!check.ok) {
      try {
        fs.unlinkSync(file.path);
      } catch (_) {}
      return res.status(400).send({
        success: false,
        data: "",
        message: `CONTENT_REJECTED: ${check.reason}`,
        code: 400,
      });
    }
  }

  return next();
};

module.exports = {
  validateFileMagicBytes,
  validateUploadedMagicBytes,
  kindsForMime,
};
