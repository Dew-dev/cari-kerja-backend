const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const recruiterHandler = require("../modules/recruiters/handlers/api_handler");
const { uploadAvatarRecruiter } = require("../middlewares/uploader");
const { validateUploadedMagicBytes } = require("../helpers/fraud/magic_bytes");

// Recruiter self-service profile routes
const recruiterRoles = [2, 3]; // recruiter (2), super_admin (3)
// VIP mutations are admin-only (recruiters must not self-grant VIP)
const adminRoles = [3, 4]; // super_admin (3), admin (4)

function verifyAdminRole(req, res, next) {
  return verifyRole(adminRoles)(req, res, next);
}

module.exports = (server) => {
  server.get(
    "/api/v1/recruiters/companies",
    recruiterHandler.getAllCompanies
  );

  server.get(
    "/api/v1/recruiters/grouped-by-industry",
    recruiterHandler.getAllRecruitersByIndustry
  );

  server.get(
    "/api/v1/users/:user_id/recruiters",
    verifyToken,
    verifyRole(recruiterRoles),
    recruiterHandler.getRecruiterByUserId
  );
  server.put(
    "/api/v1/users/:user_id/recruiters/:id",
    verifyToken,
    verifyRole(recruiterRoles),
    recruiterHandler.updateOneRecruiter
  );
  server.put(
    "/api/v1/users/recruiters",
    verifyToken,
    verifyRole(recruiterRoles),
    uploadAvatarRecruiter.single("avatar"),
    validateUploadedMagicBytes(),
    recruiterHandler.updateOneRecruiterSelf
  );

  server.patch(
    "/api/v1/users/recruiters/vip",
    verifyToken,
    verifyAdminRole,
    recruiterHandler.updateRecruiterVipSelf
  );
};
