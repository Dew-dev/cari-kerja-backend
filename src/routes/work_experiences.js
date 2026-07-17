const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const workerExperiencesHandler = require("../modules/work-experiences/handlers/api_handler");

// Work experiences adalah resource milik worker (self-scoped via token).
// super_admin (3) selalu diizinkan mengakses seluruh resource.
const workerRoles = [1, 3]; // worker (1), super_admin (3)

module.exports = (server) => {
  /**
   * GET all work experiences by worker_id
   * Endpoint: /api/v1/workers/:worker_id/work-exp
   */
  server.get("/api/v1/workers/work-exp", verifyToken, verifyRole(workerRoles), workerExperiencesHandler.getAllWorkExperiences);

  /**
   * GET one work experience by id
   * Endpoint: /api/v1/workers/work-exp/:id
   */
  server.get("/api/v1/workers/work-exp/:id", verifyToken, verifyRole(workerRoles), workerExperiencesHandler.getWorkExperienceById);

  /**
   * POST insert one work experience
   * Endpoint: /api/v1/workers/work-exp
   */
  server.post("/api/v1/workers/work-exp", verifyToken, verifyRole(workerRoles), workerExperiencesHandler.insertWorkExperience);

  /**
   * PUT update one work experience by id
   * Endpoint: /api/v1/workers/worker-exp/:id
   */
  server.put("/api/v1/workers/work-exp/:id", verifyToken, verifyRole(workerRoles), workerExperiencesHandler.updateWorkExperience);

  /**
   * DELETE one work experience by id
   * Endpoint: /api/v1/workers/worker-exp/:id
   */
  server.delete("/api/v1/workers/work-exp/:id", verifyToken, verifyRole(workerRoles), workerExperiencesHandler.deleteWorkExperience);
};
