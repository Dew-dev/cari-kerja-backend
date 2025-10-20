const verifyToken = require("../middlewares/verifyToken");
const educationsHandler = require("../modules/educations/handlers/api_handler");

module.exports = (server) => {
  /**
   * GET all educations by worker_id
   * Endpoint: /api/v1/workers/educations
   */
  server.get("/api/v1/workers/educations", verifyToken, educationsHandler.getAllEducations);

  /**
   * GET one education by id
   * Endpoint: /api/v1/workers/educations/:id
   */
  server.get("/api/v1/workers/educations/:id", verifyToken, educationsHandler.getEducationsById);

  /**
   * POST insert one education
   * Endpoint: /api/v1/workers/educations
   */
  server.post("/api/v1/workers/educations", verifyToken, educationsHandler.insertEducations);

  /**
   * PUT update one education by id
   * Endpoint: /api/v1/workers/educations/:id
   */
  server.put("/api/v1/workers/educations/:id", verifyToken, educationsHandler.updateEducations);

  /**
   * DELETE one education by id
   * Endpoint: /api/v1/workers/educations/:id
   */
  server.delete("/api/v1/workers/educations/:id", verifyToken, educationsHandler.deleteEducations);
};
