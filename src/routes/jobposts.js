const verifyToken = require("../middlewares/verifyToken");
const optionalVerifyToken = require("../middlewares/optionalVerifyToken");
const verifyRole = require("../middlewares/verifyRole");
const jobpostHandler = require("../modules/job_posts/handlers/api_handler");
const Applications = require("../modules/job_applications/handlers/api_handler");
const applyLimiter = require("../middlewares/rateLimitApply");
const jobSearchLimiter = require("../middlewares/rateLimitJobSearch");

// Worker self-service application flows
const workerRoles = [1, 3]; // worker, super_admin
// Recruiter job post & applicant management
const recruiterRoles = [2, 3]; // recruiter, super_admin
// Authenticated users who may view application questions
const workerOrRecruiterRoles = [1, 2, 3];

module.exports = (server) => {
  server.get(
    "/api/v1/recruiters/job-posts/self",
    verifyToken,
    verifyRole(recruiterRoles),
    jobpostHandler.getJobpostsSelf,
  );
  // Register before /job-posts/:id so "hot" / "applied" are not parsed as ids
  server.get(
    "/api/v1/job-posts/hot",
    ...jobSearchLimiter,
    optionalVerifyToken,
    jobpostHandler.getHotJobposts,
  );
  server.get(
    "/api/v1/job-posts/applied/self",
    verifyToken,
    verifyRole(workerRoles),
    jobpostHandler.getAppliedJobposts,
  );
  server.get(
    "/api/v1/job-posts/:id",
    optionalVerifyToken,
    jobpostHandler.getJobpostById,
  );
  server.get(
    "/api/v1/recruiters/:recruiter_id/job-posts",
    verifyToken,
    verifyRole(recruiterRoles),
    jobpostHandler.getJobpostsByRecruiterId,
  );
  server.post(
    "/api/v1/job-posts/status/:id",
    verifyToken,
    verifyRole(recruiterRoles),
    jobpostHandler.updateJobPostStatus,
  );
  server.get(
    "/api/v1/job-posts",
    ...jobSearchLimiter,
    optionalVerifyToken,
    jobpostHandler.getJobposts,
  );
  server.post(
    "/api/v1/job-posts",
    verifyToken,
    verifyRole(recruiterRoles),
    jobpostHandler.createJobPost,
  );
  server.post(
    "/api/v1/job-posts/:id/create-questions",
    verifyToken,
    verifyRole(recruiterRoles),
    jobpostHandler.createJobPostQuestions,
  );
  server.post(
    "/api/v1/job-posts/:question_id/update-questions",
    verifyToken,
    verifyRole(recruiterRoles),
    jobpostHandler.updateJobPostQuestions,
  );
  server.get(
    "/api/v1/job-posts/:id/questions",
    verifyToken,
    verifyRole(workerOrRecruiterRoles),
    jobpostHandler.getJobpostQuestions,
  );
  server.post(
    "/api/v1/job-posts/:job_post_id/create-answers",
    verifyToken,
    verifyRole(workerRoles),
    jobpostHandler.createJobPostAnswers,
  );
  server.post(
    "/api/v1/job-posts/:job_post_id/apply",
    verifyToken,
    verifyRole(workerRoles),
    applyLimiter,
    jobpostHandler.createJobApplication,
  );

  server.delete(
    "/api/v1/job-applications/:job_post_id",
    verifyToken,
    verifyRole(workerRoles),
    jobpostHandler.deleteAppliedJobpost,
  );

  server.get("/api/v1/currencies/:code", jobpostHandler.getCurrencyByCode);

  server.get(
    "/api/v1/job-posts/:job_post_id/applicants",
    verifyToken,
    verifyRole(recruiterRoles),
    jobpostHandler.getJobApplicants,
  );

  server.put(
    "/api/v1/job-applications/:id/status",
    verifyToken,
    verifyRole(recruiterRoles),
    jobpostHandler.updateApplicationStatus,
  );
  server.get(
    "/api/v1/job-applications/:id/worker",
    verifyToken,
    verifyRole(recruiterRoles),
    jobpostHandler.getWorkerByApplication,
  );
  server.put(
    "/api/v1/job-posts/:id",
    verifyToken,
    verifyRole(recruiterRoles),
    jobpostHandler.updateJobPost,
  );
  server.post(
    "/api/v1/job-posts/:id/duplicate",
    verifyToken,
    verifyRole(recruiterRoles),
    jobpostHandler.duplicateJobPost,
  );
  server.post(
    "/api/v1/job-posts/:id/archive",
    verifyToken,
    verifyRole(recruiterRoles),
    jobpostHandler.archiveJobPost,
  );
  server.post(
    "/api/v1/job-posts/:id/restore",
    verifyToken,
    verifyRole(recruiterRoles),
    jobpostHandler.restoreJobPost,
  );
  server.delete(
    "/api/v1/job-posts/:id",
    verifyToken,
    verifyRole(recruiterRoles),
    jobpostHandler.deleteJobPost,
  );

  server.get(
    "/api/v1/job-applications/:id/notes",
    verifyToken,
    verifyRole(recruiterRoles),
    Applications.getApplicationNotes,
  );

  server.post(
    "/api/v1/job-applications/:id/notes",
    verifyToken,
    verifyRole(recruiterRoles),
    Applications.addApplicationNote,
  );
};

