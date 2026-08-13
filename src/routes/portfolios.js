const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const portfoliosHandler = require("../modules/portofolios/handler/api_handler");

// Portfolios are worker self-scoped resources.
const workerRoles = [1, 3]; // worker (1), super_admin (3)

module.exports = (server) => {
  server.get(
    "/api/v1/workers/portfolios",
    verifyToken,
    verifyRole(workerRoles),
    portfoliosHandler.getAllPortfolios
  );

  server.post(
    "/api/v1/workers/portfolios",
    verifyToken,
    verifyRole(workerRoles),
    portfoliosHandler.insertPortfolios
  );

  server.put(
    "/api/v1/workers/portfolios/:id",
    verifyToken,
    verifyRole(workerRoles),
    portfoliosHandler.updatePortfolios
  );

  server.delete(
    "/api/v1/workers/portfolios/:id",
    verifyToken,
    verifyRole(workerRoles),
    portfoliosHandler.deletePortfolios
  );
};
