const { uploadResume } = require("../middlewares/uploader");
const verifyToken = require("../middlewares/verifyToken");
const resumeHandler = require("../modules/resumes/handlers/api_handler");

module.exports = (server) => {
  server.get(
    "/api/v1/workers/resumes/:id",
    verifyToken,
    resumeHandler.getResume
  );
  server.get(
    "/api/v1/workers/resumes",
    verifyToken,
    resumeHandler.getAllResumes
  );
  server.post(
    "/api/v1/workers/resumes",
    verifyToken,
    uploadResume.single("resume"),
    resumeHandler.addResume
  );
  server.put(
    "/api/v1/workers/resumes/:id",
    verifyToken,
    resumeHandler.updateResume
  );
  server.delete(
    "/api/v1/workers/resumes/:id",
    verifyToken,
    resumeHandler.deleteResume
  );
};
