const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const experienceLevelsHandler = require("../modules/experience_levels/handlers/api_handler");

// Experience levels are lookup data — GET stays public for job filters.
// Mutations require admin (4) or super_admin (3).
const adminRoles = [3, 4];

module.exports = (server) => {
  server.get("/api/v1/experience_levels", experienceLevelsHandler.getAllExperienceLevels);
  server.get("/api/v1/experience_levels/:id", experienceLevelsHandler.getExperienceLevel);
  server.put(
    "/api/v1/experience_levels/:id",
    verifyToken,
    verifyRole(adminRoles),
    experienceLevelsHandler.updateExperienceLevel
  );
  server.post(
    "/api/v1/experience_levels",
    verifyToken,
    verifyRole(adminRoles),
    experienceLevelsHandler.addExperienceLevel
  );
  server.delete(
    "/api/v1/experience_levels/:id",
    verifyToken,
    verifyRole(adminRoles),
    experienceLevelsHandler.deleteExperienceLevel
  );
};
