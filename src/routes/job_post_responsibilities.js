const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const jobPostResponsibilitiesHandler = require("../modules/job_post_responsibilities/handlers/api_handler");

// Responsibilities are part of public job post detail — GET stays public.
// Mutations are recruiter-owned job post resources.
const recruiterRoles = [2, 3]; // recruiter (2), super_admin (3)

function verifyRecruiterRole(req, res, next) {
  return verifyRole(recruiterRoles)(req, res, next);
}

module.exports = (server) => {
  server.get(
    "/api/v1/job-posts/job-post-responsibilities/:job_post_id",
    jobPostResponsibilitiesHandler.getAllJobPostResponsibilitiesByJobPostId
  );
  server.post(
    "/api/v1/job-posts/job-post-responsibilities/:job_post_id",
    verifyToken,
    verifyRecruiterRole,
    jobPostResponsibilitiesHandler.insertJobPostResponsibility
  );
  server.put(
    "/api/v1/job-posts/job-post-responsibilities/:job_post_id",
    verifyToken,
    verifyRecruiterRole,
    jobPostResponsibilitiesHandler.updateJobPostResponsibility
  );
  server.delete(
    "/api/v1/job-posts/job-post-responsibilities/:job_post_id",
    verifyToken,
    verifyRecruiterRole,
    jobPostResponsibilitiesHandler.deleteJobPostResponsibility
  );
};
