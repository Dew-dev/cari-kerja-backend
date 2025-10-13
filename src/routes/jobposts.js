const verifyToken = require("../middlewares/verifyToken");
const jobpostHandler = require("../modules/job_posts/handlers/api_handler");

module.exports = (server) => {
    server.get("/api/v1/job-posts/:id", verifyToken, jobpostHandler.getJobpostById);
    server.get("/api/v1/recruiters/:recruiter_id/job-posts", verifyToken, jobpostHandler.getJobpostsByRecruiterId);
    server.post("/api/v1/job-posts", verifyToken, jobpostHandler.createJobPost);
}