const industryHandler = require("../modules/nationalities/handlers/api_handler");

module.exports = (server) => {
  server.get("/api/v1/nationalities", industryHandler.getAllNationalities);
  server.get("/api/v1/nationalities/:id", industryHandler.getNationality);
  server.put("/api/v1/nationalities/:id", industryHandler.updateNationality);
  server.post("/api/v1/nationalities", industryHandler.addNationality);
  server.delete("/api/v1/nationalities/:id", industryHandler.deleteNationality);
};
