const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const workerSkillsHandler = require("../modules/worker-skills/handlers/api_handler");

// Worker skills adalah resource milik worker (self-scoped via token).
// super_admin (3) selalu diizinkan mengakses seluruh resource.
const workerRoles = [1, 3]; // worker (1), super_admin (3)

module.exports = (server) => {
  /**
   * GET all worker skills by worker_id
   * Endpoint: /api/v1/workers/:worker_id/skills
   */
  server.get("/api/v1/workers/skills", verifyToken, verifyRole(workerRoles), workerSkillsHandler.getAllWorkerSkills);

  /**
   * POST insert one worker skill
   * Endpoint: /api/v1/workers/skills
   */
  server.post("/api/v1/workers/skills", verifyToken, verifyRole(workerRoles), workerSkillsHandler.insertWorkerSkills);

  /**
   * DELETE one worker skill by worker_id and skill_id
   * Endpoint: /api/v1/workers/skills/id
   */
  server.delete("/api/v1/workers/skills/:id", verifyToken, verifyRole(workerRoles), workerSkillsHandler.deleteWorkerSkills);
}
