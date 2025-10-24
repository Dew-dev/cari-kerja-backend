const verifyToken = require("../middlewares/verifyToken");
const jobpostHandler = require("../modules/job_posts/handlers/api_handler");

module.exports = (server) => {
  server.get(
    "/api/v1/recruiters/job-posts/self",
    verifyToken,
    jobpostHandler.getJobpostsSelf
  );
  server.get(
    "/api/v1/job-posts/:id",
    verifyToken,
    jobpostHandler.getJobpostById
  );
  server.get(
    "/api/v1/recruiters/:recruiter_id/job-posts",
    verifyToken,
    jobpostHandler.getJobpostsByRecruiterId
  );
  server.get("/api/v1/job-posts", verifyToken, jobpostHandler.getJobposts);
  server.post("/api/v1/job-posts", verifyToken, jobpostHandler.createJobPost);
  server.post(
    "/api/v1/job-posts/:id/create-questions",
    verifyToken,
    jobpostHandler.createJobPostQuestions
  );
  server.post(
    "/api/v1/job-posts/:question_id/update-questions",
    verifyToken,
    jobpostHandler.updateJobPostQuestions
  );
  server.get(
    "/api/v1/job-posts/:id/questions",
    verifyToken,
    jobpostHandler.getJobpostQuestions
  );
};
