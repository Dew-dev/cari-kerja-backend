const employmentTypesHandler = require("../modules/employment_types/handlers/api_handler");

module.exports = (server) => {
  server.get("/api/v1/employment_types", employmentTypesHandler.getAllEmploymentTypes);
  server.get("/api/v1/employment_types/:id", employmentTypesHandler.getEmploymentType);
  server.put("/api/v1/employment_types/:id", employmentTypesHandler.updateEmploymentType);
  server.post("/api/v1/employment_types", employmentTypesHandler.addEmploymentType);
  server.delete("/api/v1/employment_types/:id", employmentTypesHandler.deleteEmploymentType);
};
