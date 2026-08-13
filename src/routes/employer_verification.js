const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const verifyCompanyPermission = require("../middlewares/verifyCompanyPermission");
const handler = require("../modules/employer_verification/handlers/api_handler");
const { uploadVerificationDoc } = require("../middlewares/uploader");
const { validateUploadedMagicBytes } = require("../helpers/fraud/magic_bytes");

const recruiterRoles = [2];

module.exports = (server) => {
  server.get(
    "/api/v1/employer-verification/doc-types",
    verifyToken,
    verifyRole(recruiterRoles),
    handler.getDocTypes
  );

  server.get(
    "/api/v1/employer-verification/status",
    verifyToken,
    verifyRole(recruiterRoles),
    handler.getStatus
  );

  server.put(
    "/api/v1/employer-verification/application",
    verifyToken,
    verifyRole(recruiterRoles),
    verifyCompanyPermission("manage_verification"),
    handler.upsertDraft
  );

  server.post(
    "/api/v1/employer-verification/documents",
    verifyToken,
    verifyRole(recruiterRoles),
    verifyCompanyPermission("manage_verification"),
    uploadVerificationDoc.single("document"),
    validateUploadedMagicBytes(),
    handler.uploadDocument
  );

  server.delete(
    "/api/v1/employer-verification/documents/:doc_type",
    verifyToken,
    verifyRole(recruiterRoles),
    verifyCompanyPermission("manage_verification"),
    handler.deleteDocument
  );

  server.post(
    "/api/v1/employer-verification/submit",
    verifyToken,
    verifyRole(recruiterRoles),
    verifyCompanyPermission("manage_verification"),
    handler.submitApplication
  );

  server.post(
    "/api/v1/employer-verification/reactivate",
    verifyToken,
    verifyRole(recruiterRoles),
    verifyCompanyPermission("manage_verification"),
    handler.requestReactivation
  );
};
