const verifyToken = require("../middlewares/verifyToken");
const optionalVerifyToken = require("../middlewares/optionalVerifyToken");
const verifyRole = require("../middlewares/verifyRole");
const jobpostHandler = require("../modules/job_posts/handlers/api_handler");
const Applications = require("../modules/job_applications/handlers/api_handler");

// Worker self-service application flows
const workerRoles = [1, 3]; // worker, super_admin
// Recruiter application management flows
const recruiterRoles = [2, 3]; // recruiter, super_admin

module.exports = (server) => {
  server.get(
    "/api/v1/recruiters/job-posts/self",
    verifyToken,
    jobpostHandler.getJobpostsSelf,
  );
  server.get(
    "/api/v1/job-posts/:id",
    optionalVerifyToken,
    jobpostHandler.getJobpostById,
  );
  server.get(
    "/api/v1/recruiters/:recruiter_id/job-posts",
    jobpostHandler.getJobpostsByRecruiterId,
  );
  server.post(
    "/api/v1/job-posts/status/:id",
    verifyToken,
    jobpostHandler.updateJobPostStatus,
  );
  server.get(
    "/api/v1/job-posts",
    optionalVerifyToken,
    jobpostHandler.getJobposts,
  ); //No token needed
  server.post("/api/v1/job-posts", verifyToken, jobpostHandler.createJobPost);
  server.post(
    "/api/v1/job-posts/:id/create-questions",
    verifyToken,
    jobpostHandler.createJobPostQuestions,
  );
  server.post(
    "/api/v1/job-posts/:question_id/update-questions",
    verifyToken,
    jobpostHandler.updateJobPostQuestions,
  );
  server.get(
    "/api/v1/job-posts/:id/questions",
    verifyToken,
    jobpostHandler.getJobpostQuestions,
  );
  server.post(
    "/api/v1/job-posts/:job_post_id/create-answers",
    verifyToken,
    jobpostHandler.createJobPostAnswers,
  );
  server.post(
    "/api/v1/job-posts/:job_post_id/apply",
    verifyToken,
    verifyRole(workerRoles),
    jobpostHandler.createJobApplication,
  );

  server.get(
    "/api/v1/job-posts/applied/self",
    verifyToken,
    verifyRole(workerRoles),
    jobpostHandler.getAppliedJobposts,
  );

  server.delete(
    "/api/v1/job-applications/:job_post_id",
    verifyToken,
    verifyRole(workerRoles),
    jobpostHandler.deleteAppliedJobpost,
  );

  server.get("/api/v1/currencies/:code", jobpostHandler.getCurrencyByCode);
  server.get(
    "/api/v1/categories/name/:name",
    jobpostHandler.getCategoriesByName,
  );

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
    jobpostHandler.updateJobPost,
  );
  server.post(
    "/api/v1/job-posts/:id/duplicate",
    verifyToken,
    jobpostHandler.duplicateJobPost,
  );
  server.post(
    "/api/v1/job-posts/:id/archive",
    verifyToken,
    jobpostHandler.archiveJobPost,
  );
  server.post(
    "/api/v1/job-posts/:id/restore",
    verifyToken,
    jobpostHandler.restoreJobPost,
  );
  server.delete(
    "/api/v1/job-posts/:id",
    verifyToken,
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
