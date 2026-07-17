const jobtagsHandler = require("../modules/job_tags/handlers/api_handler");
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");

// Tag mutations are recruiter-owned; GET endpoints stay public for job detail.
const recruiterRoles = [2, 3]; // recruiter (2), super_admin (3)

function verifyRecruiterRole(req, res, next) {
  return verifyRole(recruiterRoles)(req, res, next);
}

module.exports = (server) => {
  server.get(
    "/api/v1/job-posts/:job_post_id/tags",
    jobtagsHandler.getTagsPerJobPost
  );
  server.get("/api/v1/tags/:name", jobtagsHandler.getOneTagByName);
  server.get("/api/v1/tags/all/:name", jobtagsHandler.getTagByName);
  server.get(
    "/api/v1/tags/:tag_id/:job_post_id",
    jobtagsHandler.getOneJobPostTagByTagIdAndJobPostId
  );
  server.post(
    "/api/v1/tags/:job_post_id",
    verifyToken,
    verifyRecruiterRole,
    jobtagsHandler.createJobPostTag
  );
  server.delete(
    "/api/v1/tags/:job_post_id",
    verifyToken,
    verifyRecruiterRole,
    jobtagsHandler.deleteJobPostTag
  );
  server.post(
    "/api/v1/tags",
    verifyToken,
    verifyRecruiterRole,
    jobtagsHandler.createJobTag
  );
};
