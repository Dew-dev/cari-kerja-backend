const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const nationalitiesHandler = require("../modules/nationalities/handlers/api_handler");

// Nationalities are lookup data — GET stays public.
// Mutations require admin (4) or super_admin (3).
const adminRoles = [3, 4];

module.exports = (server) => {
  server.get("/api/v1/nationalities", nationalitiesHandler.getAllNationalities);
  server.get("/api/v1/nationalities/:id", nationalitiesHandler.getNationality);
  server.put(
    "/api/v1/nationalities/:id",
    verifyToken,
    verifyRole(adminRoles),
    nationalitiesHandler.updateNationality
  );
  server.post(
    "/api/v1/nationalities",
    verifyToken,
    verifyRole(adminRoles),
    nationalitiesHandler.addNationality
  );
  server.delete(
    "/api/v1/nationalities/:id",
    verifyToken,
    verifyRole(adminRoles),
    nationalitiesHandler.deleteNationality
  );
};
