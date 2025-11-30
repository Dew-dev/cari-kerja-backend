const experienceLevelsHandler = require("../modules/experience_levels/handlers/api_handler");

module.exports = (server) => {
  server.get("/api/v1/experience_levels", experienceLevelsHandler.getAllExperienceLevels);
  server.get("/api/v1/experience_levels/:id", experienceLevelsHandler.getExperienceLevel);
  server.put("/api/v1/experience_levels/:id", experienceLevelsHandler.updateExperienceLevel);
  server.post("/api/v1/experience_levels", experienceLevelsHandler.addExperienceLevel);
  server.delete("/api/v1/experience_levels/:id", experienceLevelsHandler.deleteExperienceLevel);
};
