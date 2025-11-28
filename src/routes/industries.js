const industryHandler = require("../modules/industries/handlers/api_handler");

module.exports = (server) => {
  server.get(
    "/api/v1/industries",
    industryHandler.getAllIndustries
  );
  server.get(
    "/api/v1/industries/:id",
    industryHandler.getIndustry
  );
  server.put(
    "/api/v1/industries/:id",
    industryHandler.updateIndustry
  );
  server.post("/api/v1/industries", industryHandler.addIndustry);
  server.delete(
    "/api/v1/industries/:id",
    industryHandler.deleteIndustry
  );
};
