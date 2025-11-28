const genderHandler = require("../modules/genders/handlers/api_handler");

module.exports = (server) => {
  server.get("/api/v1/genders", genderHandler.getAllGenders);
  server.get("/api/v1/genders/:id", genderHandler.getGender);
  server.put("/api/v1/genders/:id", genderHandler.updateGender);
  server.post("/api/v1/genders", genderHandler.addGender);
  server.delete("/api/v1/genders/:id", genderHandler.deleteGender);
};
