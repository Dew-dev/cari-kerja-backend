const { uploadResume } = require("../middlewares/uploader");
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const resumeHandler = require("../modules/resumes/handlers/api_handler");
const { validateUploadedMagicBytes } = require("../helpers/fraud/magic_bytes");

// Resumes are worker self-scoped resources.
const workerRoles = [1, 3]; // worker (1), super_admin (3)

module.exports = (server) => {
  server.get(
    "/api/v1/workers/resumes",
    verifyToken,
    verifyRole(workerRoles),
    resumeHandler.getAllResumes
  );
  server.get(
    "/api/v1/workers/resumes/:id/signed-url",
    verifyToken,
    verifyRole(workerRoles),
    resumeHandler.getResumeSignedUrl
  );
  server.get(
    "/api/v1/workers/resumes/:id",
    verifyToken,
    verifyRole(workerRoles),
    resumeHandler.getResume
  );
  server.post(
    "/api/v1/workers/resumes",
    verifyToken,
    verifyRole(workerRoles),
    uploadResume.single("resume"),
    validateUploadedMagicBytes(),
    resumeHandler.addResume
  );
  server.put(
    "/api/v1/workers/resumes/:id",
    verifyToken,
    verifyRole(workerRoles),
    resumeHandler.updateResume
  );
  server.delete(
    "/api/v1/workers/resumes/:id",
    verifyToken,
    verifyRole(workerRoles),
    resumeHandler.deleteResume
  );
};
