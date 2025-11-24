const verifyToken = require("../middlewares/verifyToken");
const industryHandler = require("../modules/industries/handlers/api_handler");

module.exports = (server) => {
  server.get("/api/v1/industries", verifyToken, industryHandler.getAllIndustries);
  server.get("/api/v1/industries/:id", verifyToken, industryHandler.getIndustry);
  server.put("/api/v1/industries/:id", verifyToken, industryHandler.updateIndustry);
  server.post("/api/v1/industries", verifyToken, industryHandler.addIndustry);
  server.delete("/api/v1/industries/:id", verifyToken, industryHandler.deleteIndustry);
};
