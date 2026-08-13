const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const verifyCompanyPermission = require("../middlewares/verifyCompanyPermission");
const handler = require("../modules/companies/handlers/api_handler");
const { uploadAvatarRecruiter } = require("../middlewares/uploader");
const { validateUploadedMagicBytes } = require("../helpers/fraud/magic_bytes");

const recruiterRoles = [2, 3];

module.exports = (server) => {
  // Public directory + invite preview (before /:id)
  server.get("/api/v1/companies", handler.listCompanies);
  server.get(
    "/api/v1/companies/invitations/preview",
    handler.previewInvitation
  );

  // Authenticated /me routes (before /:id)
  server.get(
    "/api/v1/companies/me",
    verifyToken,
    verifyRole(recruiterRoles),
    handler.getMyCompany
  );
  server.patch(
    "/api/v1/companies/me",
    verifyToken,
    verifyRole(recruiterRoles),
    verifyCompanyPermission("edit_company"),
    uploadAvatarRecruiter.single("avatar"),
    validateUploadedMagicBytes(),
    handler.updateMyCompany
  );

  server.get(
    "/api/v1/companies/me/members",
    verifyToken,
    verifyRole(recruiterRoles),
    handler.listMembers
  );
  server.patch(
    "/api/v1/companies/me/members/:userId",
    verifyToken,
    verifyRole(recruiterRoles),
    verifyCompanyPermission("manage_team"),
    handler.updateMemberRole
  );
  server.delete(
    "/api/v1/companies/me/members/:userId",
    verifyToken,
    verifyRole(recruiterRoles),
    verifyCompanyPermission("manage_team"),
    handler.removeMember
  );
  server.post(
    "/api/v1/companies/me/leave",
    verifyToken,
    verifyRole(recruiterRoles),
    handler.leaveCompany
  );
  server.post(
    "/api/v1/companies/me/transfer-ownership",
    verifyToken,
    verifyRole(recruiterRoles),
    handler.transferOwnership
  );

  server.get(
    "/api/v1/companies/me/invitations",
    verifyToken,
    verifyRole(recruiterRoles),
    verifyCompanyPermission("manage_team"),
    handler.listInvitations
  );
  server.post(
    "/api/v1/companies/me/invitations",
    verifyToken,
    verifyRole(recruiterRoles),
    verifyCompanyPermission("manage_team"),
    handler.createInvitation
  );
  server.post(
    "/api/v1/companies/me/invitations/:id/resend",
    verifyToken,
    verifyRole(recruiterRoles),
    verifyCompanyPermission("manage_team"),
    handler.resendInvitation
  );
  server.delete(
    "/api/v1/companies/me/invitations/:id",
    verifyToken,
    verifyRole(recruiterRoles),
    verifyCompanyPermission("manage_team"),
    handler.revokeInvitation
  );

  server.post(
    "/api/v1/companies/invitations/accept",
    verifyToken,
    verifyRole(recruiterRoles),
    handler.acceptInvitation
  );

  // Personal recruiter profile
  server.get(
    "/api/v1/recruiters/me",
    verifyToken,
    verifyRole(recruiterRoles),
    handler.getMyRecruiterProfile
  );
  server.patch(
    "/api/v1/recruiters/me",
    verifyToken,
    verifyRole(recruiterRoles),
    uploadAvatarRecruiter.single("avatar"),
    validateUploadedMagicBytes(),
    handler.updatePersonalProfile
  );

  // Public company detail (last among GETs with :id)
  server.get("/api/v1/companies/:id", handler.getCompanyById);
};
