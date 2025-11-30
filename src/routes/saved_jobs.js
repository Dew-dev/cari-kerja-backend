const verifyToken = require("../middlewares/verifyToken");
const savedJobsHandler = require("../modules/saved_jobs/handlers/api_handler");

module.exports = (server) => {
  server.get(
    "/api/v1/workers/saved-jobs/self",
    verifyToken,
    savedJobsHandler.getSavedJobs
  );
  server.get("/api/v1/saved-jobs/:id", savedJobsHandler.getSavedJobsById);
  server.get(
    "/api/v1/workers/:worker_id/saved-jobs",
    verifyToken,
    savedJobsHandler.getSavedJobsByWorkerId
  );
  server.get("/api/v1/saved-jobs", savedJobsHandler.getSavedJobs); //No token needed
  server.post("/api/v1/saved-jobs/:job_post_id", verifyToken, savedJobsHandler.createSavedJob);
  server.delete("/api/v1/saved-jobs/:id", verifyToken, savedJobsHandler.deleteJobPost);
};
