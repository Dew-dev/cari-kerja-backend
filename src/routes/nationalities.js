const nationalitiesHandler = require("../modules/nationalities/handlers/api_handler");

module.exports = (server) => {
  server.get("/api/v1/nationalities", nationalitiesHandler.getAllNationalities);
  server.get("/api/v1/nationalities/:id", nationalitiesHandler.getNationality);
  server.put("/api/v1/nationalities/:id", nationalitiesHandler.updateNationality);
  server.post("/api/v1/nationalities", nationalitiesHandler.addNationality);
  server.delete("/api/v1/nationalities/:id", nationalitiesHandler.deleteNationality);
};
