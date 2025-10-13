const verifyToken = require("../middlewares/verifyToken");
const languagesHandler = require("../modules/languages/handlers/api_handler");

module.exports = (server) => {
  /**
   * GET all languages by worker_id
   * Endpoint: /api/v1/workers/languages
   */
  server.get("/api/v1/workers/languages", verifyToken, languagesHandler.getAllLanguages);

  /**
   * POST insert one language
   * Endpoint: /api/v1/workers/languages
   */
  server.post("/api/v1/workers/languages", verifyToken, languagesHandler.insertLanguages);

  /**
   * PUT update one language by id
   * Endpoint: /api/v1/workers/languages/:id
   */
  server.put("/api/v1/workers/languages/:id", verifyToken, languagesHandler.updateLanguages);

  /**
   * DELETE one language by id
   * Endpoint: /api/v1/workers/languages/:id
   */
  server.delete("/api/v1/workers/languages/:id", verifyToken, languagesHandler.deleteLanguages);
};
