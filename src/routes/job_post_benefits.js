const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const jobPostBenefitsHandler = require("../modules/job_post_benefits/handlers/api_handler");

// Benefits are part of public job post detail — GET stays public.
// Mutations are recruiter-owned job post resources.
const recruiterRoles = [2, 3]; // recruiter (2), super_admin (3)

module.exports = (server) => {
  server.get(
    "/api/v1/job-posts/job-post-benefits/:job_post_id",
    jobPostBenefitsHandler.getAllJobPostBenefitsByJobPostId
  );
  server.post(
    "/api/v1/job-posts/job-post-benefits/:job_post_id",
    verifyToken,
    verifyRole(recruiterRoles),
    jobPostBenefitsHandler.insertJobPostBenefit
  );
  server.put(
    "/api/v1/job-posts/job-post-benefits/:job_post_id",
    verifyToken,
    verifyRole(recruiterRoles),
    jobPostBenefitsHandler.updateJobPostBenefit
  );
  server.delete(
    "/api/v1/job-posts/job-post-benefits/:job_post_id",
    verifyToken,
    verifyRole(recruiterRoles),
    jobPostBenefitsHandler.deleteJobPostBenefit
  );
};
