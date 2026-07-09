const { ForbiddenError } = require("../helpers/errors");
const wrapper = require("../helpers/utils/wrapper");
const { ERROR } = require("../helpers/http-status/status_code");

/**
 * Middleware to verify if the user's role matches any of the allowed roles
 * @param {number[]} allowedRoleIds - Array of allowed role IDs (e.g. [3, 4] for super_admin and admin)
 */
const verifyRole = (allowedRoleIds) => {
  return (req, res, next) => {
    try {
      // req.userMeta is populated by verifyToken middleware
      if (!req.userMeta || !req.userMeta.role_id) {
        return wrapper.response(
          res,
          "fail",
          { err: new ForbiddenError("Role context missing. Please re-login.") },
          "Forbidden Access",
          ERROR.FORBIDDEN
        );
      }

      const userRoleId = req.userMeta.role_id;
      
      if (!allowedRoleIds.includes(userRoleId)) {
        return wrapper.response(
          res,
          "fail",
          { err: new ForbiddenError("You do not have permission to access this resource.") },
          "Forbidden Access",
          ERROR.FORBIDDEN
        );
      }

      next();
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

module.exports = verifyRole;
