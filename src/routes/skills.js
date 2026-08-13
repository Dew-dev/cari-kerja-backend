const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const skillHandler = require("../modules/skills/handlers/api_handler");

// Master data skills dipakai oleh worker (profil) dan recruiter (job post/pencarian kandidat).
// super_admin (3) selalu diizinkan mengakses seluruh resource.
const skillRoles = [1, 2, 3]; // worker (1), recruiter (2), super_admin (3)

module.exports = (server) => {
  server.get("/api/v1/skills", verifyToken, verifyRole(skillRoles), skillHandler.getAllSkills);
  server.get("/api/v1/skills/:id", verifyToken, verifyRole(skillRoles), skillHandler.getSkill);
  server.put("/api/v1/skills/:id", verifyToken, verifyRole(skillRoles), skillHandler.updateSkill);
  server.post("/api/v1/skills", verifyToken, verifyRole(skillRoles), skillHandler.addSkill);
  server.delete("/api/v1/skills/:id", verifyToken, verifyRole(skillRoles), skillHandler.deleteSkill);
};
