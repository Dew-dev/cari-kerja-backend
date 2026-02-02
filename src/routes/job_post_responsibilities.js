const verifyToken = require("../middlewares/verifyToken");
const jobPostResponsibilitiesHandler = require("../modules/job_post_responsibilities/handlers/api_handler");

module.exports = (server) => {
  server.get("/api/v1/job-posts/job-post-responsibilities/:job_post_id", jobPostResponsibilitiesHandler.getAllJobPostResponsibilitiesByJobPostId);
  server.post("/api/v1/job-posts/job-post-responsibilities/:job_post_id", verifyToken, jobPostResponsibilitiesHandler.insertJobPostResponsibility);
  server.put("/api/v1/job-posts/job-post-responsibilities/:job_post_id", verifyToken, jobPostResponsibilitiesHandler.updateJobPostResponsibility);
  server.delete("/api/v1/job-posts/job-post-responsibilities/:job_post_id", verifyToken, jobPostResponsibilitiesHandler.deleteJobPostResponsibility);
};