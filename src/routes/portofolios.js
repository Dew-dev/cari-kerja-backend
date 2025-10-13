const verifyToken = require("../middlewares/verifyToken");
const portofoliosHandler = require("../modules/portofolios/handlers/api_handler");

module.exports = (server) => {
  /**
   * GET all portofolios by worker_id
   * Endpoint: /api/v1/workers/portofolios
   */
  server.get("/api/v1/workers/portofolios", verifyToken, portofoliosHandler.getAllPortofolios);

  /**
   * POST insert one portofolio
   * Endpoint: /api/v1/workers/portofolios
   */
  server.post("/api/v1/workers/portofolios", verifyToken, portofoliosHandler.insertPortofolios);

  /**
   * PUT update one portofolio by id
   * Endpoint: /api/v1/workers/portofolios/:id
   */
  server.put("/api/v1/workers/portofolios/:id", verifyToken, portofoliosHandler.updatePortofolios);

  /**
   * DELETE one portofolio by id
   * Endpoint: /api/v1/workers/portofolios/:id
   */
  server.delete("/api/v1/workers/portofolios/:id", verifyToken, portofoliosHandler.deletePortofolios);
};
