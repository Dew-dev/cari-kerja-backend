const verifyToken = require("../middlewares/verifyToken");
const jobPostRequirementsHandler = require("../modules/job_post_requirements/handlers/api_handler");

module.exports = (server) => {
  server.get("/api/v1/job-posts/job-post-requirements", jobPostRequirementsHandler.getAllJobPostRequirementsByJobPostId);
  server.post("/api/v1/job-posts/job-post-requirements/:job_post_id", verifyToken, jobPostRequirementsHandler.insertJobPostRequirements);
  server.put("/api/v1/job-posts/job-post-requirements/:job_post_id", verifyToken, jobPostRequirementsHandler.updateJobPostRequirements);
  server.delete("/api/v1/job-posts/job-post-requirements/:job_post_id", verifyToken, jobPostRequirementsHandler.deleteJobPostRequirements);
};
