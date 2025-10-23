const jobtagsHandler = require("../modules/job_tags/handlers/api_handler");
const verifyToken = require("../middlewares/verifyToken");

module.exports = (server) => {
    server.get("/api/v1/job-posts/:job_post_id/tags", jobtagsHandler.getTagsPerJobPost);
    server.get("/api/v1/tags/:name", verifyToken, jobtagsHandler.getOneTagByName);
    server.get("/api/v1/tags/:tag_id/:job_post_id", jobtagsHandler.getOneJobPostTagByTagIdAndJobPostId);
    server.post("/api/v1/tags/:job_post_id", verifyToken, jobtagsHandler.createJobPostTag);
    server.delete("/api/v1/tags/:job_post_id", verifyToken, jobtagsHandler.deleteJobPostTag);
}