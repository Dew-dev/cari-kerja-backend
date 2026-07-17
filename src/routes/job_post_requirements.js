const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const jobPostRequirementsHandler = require("../modules/job_post_requirements/handlers/api_handler");

// Requirements are part of public job post detail — GET stays public.
// Mutations are recruiter-owned job post resources.
const recruiterRoles = [2, 3]; // recruiter (2), super_admin (3)

function verifyRecruiterRole(req, res, next) {
  return verifyRole(recruiterRoles)(req, res, next);
}

module.exports = (server) => {
  server.get(
    "/api/v1/job-posts/job-post-requirements/:job_post_id",
    jobPostRequirementsHandler.getAllJobPostRequirementsByJobPostId
  );
  server.post(
    "/api/v1/job-posts/job-post-requirements/:job_post_id",
    verifyToken,
    verifyRecruiterRole,
    jobPostRequirementsHandler.insertJobPostRequirements
  );
  server.put(
    "/api/v1/job-posts/job-post-requirements/:job_post_id",
    verifyToken,
    verifyRecruiterRole,
    jobPostRequirementsHandler.updateJobPostRequirements
  );
  server.delete(
    "/api/v1/job-posts/job-post-requirements/:job_post_id",
    verifyToken,
    verifyRecruiterRole,
    jobPostRequirementsHandler.deleteJobPostRequirements
  );
};
