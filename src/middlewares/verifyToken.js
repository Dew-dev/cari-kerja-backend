const { UnauthorizedError, ForbiddenError } = require("../helpers/errors");
const { sendResponse } = require("../helpers/utils/response");
const { getToken, verifyAccessToken } = require("../helpers/auth/jwt_helper");
const { assertUserNotSuspendedById } = require("../helpers/auth/account_guards");
const { ERROR } = require("../helpers/http-status/status_code");
const wrapper = require("../helpers/utils/wrapper");

/** Paths allowed while suspended for incomplete company verification. */
const VERIFICATION_RESTRICTED_ALLOWLIST = [
  "/api/v1/employer-verification",
  "/api/v1/users/logout",
  "/api/v1/users/refresh-token",
];

const isVerificationAllowlisted = (reqPath) =>
  VERIFICATION_RESTRICTED_ALLOWLIST.some(
    (prefix) => reqPath === prefix || reqPath.startsWith(`${prefix}/`)
  );

const verifyToken = async (req, res, next) => {
  const result = { err: null, data: null };

  let token = getToken(req.headers["authorization"]);

  if (!token) {
    token = req.cookies?.token || req.cookies?.accessToken || null;
  }

  if (!token) {
    result.err = new UnauthorizedError("User Unauthorized");
    return wrapper.response(res, "fail", result, "Invalid", ERROR.UNAUTHORIZED);
  }

  const checkedToken = await verifyAccessToken(token);

  if (checkedToken.err) {
    return sendResponse(checkedToken, res, ERROR.FORBIDDEN);
  }

  const suspension = await assertUserNotSuspendedById(checkedToken.data?.id);
  if (suspension.err) {
    return sendResponse(suspension, res, ERROR.FORBIDDEN);
  }

  const restricted = Boolean(suspension.data?.restricted_verification);
  if (restricted && !isVerificationAllowlisted(req.path || "")) {
    return sendResponse(
      wrapper.error(
        new ForbiddenError(
          "ACCOUNT_RESTRICTED: VERIFICATION_REQUIRED: Complete company verification documents to restore access"
        )
      ),
      res,
      ERROR.FORBIDDEN
    );
  }

  req.userMeta = {
    ...checkedToken.data,
    restricted_verification: restricted,
    suspension_reason: suspension.data?.suspension_reason || null,
  };
  next();
};

module.exports = verifyToken;
