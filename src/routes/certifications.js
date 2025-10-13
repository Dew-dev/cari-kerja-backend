const verifyToken = require("../middlewares/verifyToken");
const certificationHandler = require("../modules/certifications/handlers/api_handlers");

module.exports = (server) => {
  server.get("/api/v1/workers/cert/:id", verifyToken, certificationHandler.getOneCertification);
  server.get("/api/v1/workers/cert", verifyToken, certificationHandler.getAllCertifications);
};
