const { ForbiddenError } = require("../helpers/errors");
const wrapper = require("../helpers/utils/wrapper");
const { ERROR } = require("../helpers/http-status/status_code");
const {
  canEditCompany,
  canManageTeam,
  canManageBilling,
  canManageVerification,
} = require("../helpers/auth/company_permissions");

const CHECKERS = {
  edit_company: canEditCompany,
  manage_team: canManageTeam,
  manage_billing: canManageBilling,
  manage_verification: canManageVerification,
};

/**
 * Require JWT company_role permission after verifyToken + verifyRole(recruiter).
 * @param {'edit_company'|'manage_team'|'manage_billing'|'manage_verification'} permission
 */
const verifyCompanyPermission = (permission) => {
  const checker = CHECKERS[permission];
  if (!checker) {
    throw new Error(`Unknown company permission: ${permission}`);
  }

  return (req, res, next) => {
    try {
      if (req.userMeta?.role_id === 3 || req.userMeta?.role_id === 4) {
        return next();
      }

      const role = req.userMeta?.company_role;
      if (!role || !checker(role)) {
        return wrapper.response(
          res,
          "fail",
          {
            err: new ForbiddenError(
              "You do not have permission to perform this company action."
            ),
          },
          "Forbidden Access",
          ERROR.FORBIDDEN
        );
      }
      return next();
    } catch (error) {
      return wrapper.response(
        res,
        "fail",
        { err: error },
        "Internal Server Error",
        ERROR.INTERNAL_ERROR
      );
    }
  };
};

module.exports = verifyCompanyPermission;
