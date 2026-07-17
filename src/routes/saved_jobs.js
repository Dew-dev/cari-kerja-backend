const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const savedJobsHandler = require("../modules/saved_jobs/handlers/api_handler");

// Saved Jobs adalah resource milik worker. super_admin (3) selalu diizinkan mengakses seluruh resource.
const workerRoles = [1, 3]; // worker (1), super_admin (3)

module.exports = (server) => {
  server.get(
    "/api/v1/workers/saved-jobs/self",
    verifyToken,
    verifyRole(workerRoles),
    savedJobsHandler.getSavedJobsSelf
  );
  server.get(
    "/api/v1/saved-jobs/:id",
    verifyToken,
    verifyRole(workerRoles),
    savedJobsHandler.getSavedJobsById
  );
  server.get(
    "/api/v1/workers/:worker_id/saved-jobs",
    verifyToken,
    verifyRole(workerRoles),
    savedJobsHandler.getSavedJobsByWorkerId
  );
  server.get(
    "/api/v1/saved-jobs",
    verifyToken,
    verifyRole(workerRoles),
    savedJobsHandler.getSavedJobs
  );
  server.post(
    "/api/v1/saved-jobs/:job_post_id",
    verifyToken,
    verifyRole(workerRoles),
    savedJobsHandler.createSavedJob
  );
  server.delete(
    "/api/v1/saved-jobs/:id",
    verifyToken,
    verifyRole(workerRoles),
    savedJobsHandler.deleteJobPost
  );
};
