const jobtagsHandler = require("../modules/job_tags/handlers/api_handler");
const verifyToken = require("../middlewares/verifyToken");

module.exports = (server) => {
    server.get("/api/v1/job-posts/:job_post_id/tags", verifyToken, jobtagsHandler.getTagsPerJobPost);
    server.get("/api/v1/tags/:name", verifyToken, jobtagsHandler.getOneTagByName);
    server.post("/api/v1/tags/:job_post_id", verifyToken, jobtagsHandler.createJobPostTag);
}