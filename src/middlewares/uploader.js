const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Utility pembuat uploader
function createUploader(folder, allowedMimeTypes, maxSizeMB = 2) {
  const uploadPath = path.join(__dirname, `../uploads/${folder}`);

  // Pastikan folder ada
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const fileName = `${folder}-${Date.now()}${ext}`;
      cb(null, fileName);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
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
  ["image/jpeg", "image/png", "image/jpg"],
  2
);

const uploadAvatarWorker = createUploader(
  "avatars/worker",
  ["image/jpeg", "image/png", "image/jpg"],
  2
);

// Resume → PDF only, max 5MB
const uploadResume = createUploader("resumes", ["application/pdf"], 5);

// Portfolio → PDF, ZIP, Image (buat portofolio design)
const uploadPortfolio = createUploader(
  "portfolios",
  [
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "image/jpeg",
    "image/png",
  ],
  10 // max 10MB
);

module.exports = {
  uploadAvatarRecruiter,
  uploadAvatarWorker,
  uploadResume,
  uploadPortfolio,
};
