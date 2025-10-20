const verifyToken = require("../middlewares/verifyToken");
const workerSkillsHandler = require("../modules/worker-skills/handlers/api_handler");

module.exports = (server) => {
  /**
   * GET all worker skills by worker_id
   * Endpoint: /api/v1/workers/:worker_id/skills
   */
  server.get("/api/v1/workers/skills", verifyToken, workerSkillsHandler.getAllWorkerSkills);

  /**
   * POST insert one worker skill
   * Endpoint: /api/v1/workers/skills
   */
  server.post("/api/v1/workers/skills", verifyToken, workerSkillsHandler.insertWorkerSkills);

  /**
   * DELETE one worker skill by worker_id and skill_id
   * Endpoint: /api/v1/workers/skills/id
   */
  server.delete("/api/v1/workers/skills/:id", verifyToken, workerSkillsHandler.deleteWorkerSkills);
}
