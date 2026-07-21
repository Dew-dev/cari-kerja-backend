const verifyToken = require("../middlewares/verifyToken");
const { parseCVHandler } = require("../modules/cv-parsing/handlers/api_handler");
const { uploadCV } = require("../middlewares/uploader");
const { validateUploadedMagicBytes } = require("../helpers/fraud/magic_bytes");

module.exports = (server) => {
  /**
   * POST /api/v1/workers/cv/parse
   * Upload a CV file (PDF or DOCX, max 5 MB).
   * Returns parsed structured data: personal_info, work_experiences, educations, skills.
   */
  server.post(
    "/api/v1/workers/cv/parse",
    verifyToken,
    uploadCV.single("cv"),
    validateUploadedMagicBytes(),
    parseCVHandler
  );
};
