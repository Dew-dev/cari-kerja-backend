const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const employmentTypesHandler = require("../modules/employment_types/handlers/api_handler");

// Employment types are lookup data — GET stays public for job filters.
// Mutations require admin (4) or super_admin (3).
const adminRoles = [3, 4];

module.exports = (server) => {
  server.get("/api/v1/employment_types", employmentTypesHandler.getAllEmploymentTypes);
  server.get("/api/v1/employment_types/:id", employmentTypesHandler.getEmploymentType);
  server.put(
    "/api/v1/employment_types/:id",
    verifyToken,
    verifyRole(adminRoles),
    employmentTypesHandler.updateEmploymentType
  );
  server.post(
    "/api/v1/employment_types",
    verifyToken,
    verifyRole(adminRoles),
    employmentTypesHandler.addEmploymentType
  );
  server.delete(
    "/api/v1/employment_types/:id",
    verifyToken,
    verifyRole(adminRoles),
    employmentTypesHandler.deleteEmploymentType
  );
};
