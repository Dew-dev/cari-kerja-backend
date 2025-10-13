const verifyToken = require("../middlewares/verifyToken");
const workerExperiencesHandler = require("../modules/work-experiences/handlers/api_handler");

module.exports = (server) => {
  /**
   * GET all work experiences by worker_id
   * Endpoint: /api/v1/workers/:worker_id/work-exp
   */
  server.get("/api/v1/workers/work-exp", verifyToken, workerExperiencesHandler.getAllWorkExperiences);

  /**
   * GET one work experience by id
   * Endpoint: /api/v1/workers/work-exp/:id
   */
  server.get("/api/v1/workers/work-exp/:id", verifyToken, workerExperiencesHandler.getWorkExperienceById);

  /**
   * POST insert one work experience
   * Endpoint: /api/v1/workers/work-exp
   */
  server.post("/api/v1/workers/work-exp", verifyToken, workerExperiencesHandler.insertWorkExperience);

  /**
   * PUT update one work experience by id
   * Endpoint: /api/v1/workers/worker-exp/:id
   */
  server.put("/api/v1/workers/work-exp/:id", verifyToken, workerExperiencesHandler.updateWorkExperience);

  /**
   * DELETE one work experience by id
   * Endpoint: /api/v1/workers/worker-exp/:id
   */
  server.delete("/api/v1/workers/work-exp/:id", verifyToken, workerExperiencesHandler.deleteWorkExperience);
};
