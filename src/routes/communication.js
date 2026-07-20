const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const bulkCommunicationLimiter = require("../middlewares/rateLimitBulkCommunication");
const communicationHandler = require("../modules/communication/handlers/api_handler");

const recruiterRoles = [2, 3];
const workerRoles = [1, 3];

module.exports = (server) => {
  // Templates (recruiter)
  server.get(
    "/api/v1/recruiter/communication/templates",
    verifyToken,
    verifyRole(recruiterRoles),
    communicationHandler.listTemplates,
  );
  server.post(
    "/api/v1/recruiter/communication/templates",
    verifyToken,
    verifyRole(recruiterRoles),
    communicationHandler.createTemplate,
  );
  server.put(
    "/api/v1/recruiter/communication/templates/:id",
    verifyToken,
    verifyRole(recruiterRoles),
    communicationHandler.updateTemplate,
  );
  server.delete(
    "/api/v1/recruiter/communication/templates/:id",
    verifyToken,
    verifyRole(recruiterRoles),
    communicationHandler.deleteTemplate,
  );

  // Bulk send + history
  server.post(
    "/api/v1/recruiter/communication/bulk-send",
    verifyToken,
    verifyRole(recruiterRoles),
    bulkCommunicationLimiter,
    communicationHandler.bulkSend,
  );
  server.get(
    "/api/v1/recruiter/communication/campaigns",
    verifyToken,
    verifyRole(recruiterRoles),
    communicationHandler.listCampaigns,
  );
  server.get(
    "/api/v1/recruiter/communication/campaigns/:id",
    verifyToken,
    verifyRole(recruiterRoles),
    communicationHandler.getCampaign,
  );

  // Worker GDPR preferences
  server.get(
    "/api/v1/workers/me/communication-preferences",
    verifyToken,
    verifyRole(workerRoles),
    communicationHandler.getWorkerPreferences,
  );
  server.put(
    "/api/v1/workers/me/communication-preferences",
    verifyToken,
    verifyRole(workerRoles),
    communicationHandler.updateWorkerPreferences,
  );

  // Public unsubscribe (no auth)
  server.get(
    "/api/v1/communication/unsubscribe/:token",
    communicationHandler.unsubscribe,
  );
};
