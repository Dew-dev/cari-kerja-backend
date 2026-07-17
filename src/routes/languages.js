const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const languagesHandler = require("../modules/languages/handlers/api_handler");

// Languages are worker self-scoped resources. Master list stays public.
const workerRoles = [1, 3]; // worker (1), super_admin (3)

module.exports = (server) => {
  server.get("/api/v1/languages", languagesHandler.getMasterLanguages);

  server.get(
    "/api/v1/workers/languages",
    verifyToken,
    verifyRole(workerRoles),
    languagesHandler.getAllLanguages
  );

  server.post(
    "/api/v1/workers/languages",
    verifyToken,
    verifyRole(workerRoles),
    languagesHandler.insertLanguages
  );

  server.put(
    "/api/v1/workers/languages/:id",
    verifyToken,
    verifyRole(workerRoles),
    languagesHandler.updateLanguages
  );

  server.delete(
    "/api/v1/workers/languages/:id",
    verifyToken,
    verifyRole(workerRoles),
    languagesHandler.deleteLanguages
  );
};
