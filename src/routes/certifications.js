const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const certificationHandler = require("../modules/certifications/handlers/api_handlers");

// Certifications adalah resource milik worker (self-scoped via token).
// super_admin (3) selalu diizinkan mengakses seluruh resource.
const workerRoles = [1, 3]; // worker (1), super_admin (3)

module.exports = (server) => {
  server.get("/api/v1/workers/cert/:id", verifyToken, verifyRole(workerRoles), certificationHandler.getOneCertification);
  server.get("/api/v1/workers/cert", verifyToken, verifyRole(workerRoles), certificationHandler.getAllCertifications);
  server.post("/api/v1/workers/cert", verifyToken, verifyRole(workerRoles), certificationHandler.addCertification);
  server.put("/api/v1/workers/cert/:id", verifyToken, verifyRole(workerRoles), certificationHandler.updateCertification);
  server.delete("/api/v1/workers/cert/:id", verifyToken, verifyRole(workerRoles), certificationHandler.deleteCertification);
};
