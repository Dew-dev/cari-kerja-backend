const verifyToken = require("../middlewares/verifyToken");
const portfoliosHandler = require("../modules/portofolios/handler/api_handler");

module.exports = (server) => {
  /**
   * GET all portofolios by worker_id
   * Endpoint: /api/v1/workers/portofolios
   */
  server.get("/api/v1/workers/portfolios", verifyToken, portfoliosHandler.getAllPortfolios);

  /**
   * POST insert one portofolio
   * Endpoint: /api/v1/workers/portofolios
   */
  server.post("/api/v1/workers/portfolios", verifyToken, portfoliosHandler.insertPortfolios);

  /**
   * PUT update one portofolio by id
   * Endpoint: /api/v1/workers/portofolios/:id
   */
  server.put("/api/v1/workers/portfolios/:id", verifyToken, portfoliosHandler.updatePortfolios);

  /**
   * DELETE one portofolio by id
   * Endpoint: /api/v1/workers/portofolios/:id
   */
  server.delete("/api/v1/workers/portfolios/:id", verifyToken, portfoliosHandler.deletePortfolios);
};
