const verifyToken = require("../middlewares/verifyToken");
const jobPostBenefitsHandler = require("../modules/job_post_benefits/handlers/api_handler");

module.exports = (server) => {
  server.get("/api/v1/job-posts/job-post-benefits/:job_post_id", jobPostBenefitsHandler.getAllJobPostBenefitsByJobPostId);
  server.post("/api/v1/job-posts/job-post-benefits/:job_post_id", verifyToken, jobPostBenefitsHandler.insertJobPostBenefit);
  server.put("/api/v1/job-posts/job-post-benefits/:job_post_id", verifyToken, jobPostBenefitsHandler.updateJobPostBenefit);
  server.delete("/api/v1/job-posts/job-post-benefits/:job_post_id", verifyToken, jobPostBenefitsHandler.deleteJobPostBenefit);
};
