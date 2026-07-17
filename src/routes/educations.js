const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const educationsHandler = require("../modules/educations/handlers/api_handler");

// Educations adalah resource milik worker (self-scoped via token).
// super_admin (3) selalu diizinkan mengakses seluruh resource.
const workerRoles = [1, 3]; // worker (1), super_admin (3)

module.exports = (server) => {
  /**
   * GET all educations by worker_id
   * Endpoint: /api/v1/workers/educations
   */
  server.get("/api/v1/workers/educations", verifyToken, verifyRole(workerRoles), educationsHandler.getAllEducations);

  /**
   * GET one education by id
   * Endpoint: /api/v1/workers/educations/:id
   */
  server.get("/api/v1/workers/educations/:id", verifyToken, verifyRole(workerRoles), educationsHandler.getEducationsById);

  /**
   * POST insert one education
   * Endpoint: /api/v1/workers/educations
   */
  server.post("/api/v1/workers/educations", verifyToken, verifyRole(workerRoles), educationsHandler.insertEducations);

  /**
   * PUT update one education by id
   * Endpoint: /api/v1/workers/educations/:id
   */
  server.put("/api/v1/workers/educations/:id", verifyToken, verifyRole(workerRoles), educationsHandler.updateEducations);

  /**
   * DELETE one education by id
   * Endpoint: /api/v1/workers/educations/:id
   */
  server.delete("/api/v1/workers/educations/:id", verifyToken, verifyRole(workerRoles), educationsHandler.deleteEducations);
};
