const verifyToken = require("../middlewares/verifyToken");
const skillHandler = require("../modules/skills/handlers/api_handler");

module.exports = (server) => {
  server.get("/api/v1/skills", verifyToken, skillHandler.getAllSkills);
  server.get("/api/v1/skills/:id", verifyToken, skillHandler.getSkill);
  server.put("/api/v1/skills/:id", verifyToken, skillHandler.updateSkill);
  server.post("/api/v1/skills", verifyToken, skillHandler.addSkill);
  server.delete("/api/v1/skills/:id", verifyToken, skillHandler.deleteSkill);
};
