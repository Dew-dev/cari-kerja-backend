const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const industryHandler = require("../modules/industries/handlers/api_handler");

// Industries are lookup data — GET stays public.
// Mutations require admin (4) or super_admin (3).
const adminRoles = [3, 4];

module.exports = (server) => {
  server.get("/api/v1/industries", industryHandler.getAllIndustries);
  server.get("/api/v1/industries/:id", industryHandler.getIndustry);
  server.put(
    "/api/v1/industries/:id",
    verifyToken,
    verifyRole(adminRoles),
    industryHandler.updateIndustry
  );
  server.post(
    "/api/v1/industries",
    verifyToken,
    verifyRole(adminRoles),
    industryHandler.addIndustry
  );
  server.delete(
    "/api/v1/industries/:id",
    verifyToken,
    verifyRole(adminRoles),
    industryHandler.deleteIndustry
  );
};
