const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Utility pembuat uploader
function createUploader(
  subPath, // contoh: "recruiters/avatars"
  filePrefix, // contoh: "recruiter"
  allowedMimeTypes,
  maxSizeMB = 2,
) {
  // const uploadPath = path.join(__dirname, "../uploads", subPath);
  const uploadPath = path.join("/var/www/uploads", subPath);

  // pastikan folder ada
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, uploadPath);
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      const fileName = `${filePrefix}-${Date.now()}${ext}`;
      cb(null, fileName);
    },
  });

  const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const allowedByMime = allowedMimeTypes.includes(file.mimetype);
    // Browsers/OS sometimes send DOCX/PDF as application/octet-stream
    const allowedByExt =
      (ext === ".pdf" && allowedMimeTypes.includes("application/pdf")) ||
      (ext === ".docx" &&
        allowedMimeTypes.includes(
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )) ||
      (ext === ".doc" && allowedMimeTypes.includes("application/msword"));

    if (!allowedByMime && !allowedByExt) {
      return cb(new Error("File type not allowed"), false);
    }
    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  });
}


// ==========================
// EXPORTS
// ==========================

// Avatar → JPG/PNG only
const uploadAvatarRecruiter = createUploader(
  "avatars/recruiter",
  "recruiter",
  ["image/jpeg", "image/png", "image/jpg"],
  2,
);

const uploadAvatarWorker = createUploader(
  "avatars/worker",
  "worker",
  ["image/jpeg", "image/png", "image/jpg"],
  2,
);

// Resume → PDF only, max 5MB
const uploadResume = createUploader("resumes", "resume", ["application/pdf"], 5);

// Portfolio → PDF, ZIP, Image (buat portofolio design)
const uploadPortfolio = createUploader(
  "portfolios",
  "portfolio",
  [
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "image/jpeg",
    "image/png",
  ],
  10 // max 10MB
);

// CV parsing → PDF or DOCX, max 5 MB
const uploadCV = createUploader(
  "cv-temp",
  "cv",
  [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  5
);

module.exports = {
  uploadAvatarRecruiter,
  uploadAvatarWorker,
  uploadResume,
  uploadPortfolio,
  uploadCV,
};
