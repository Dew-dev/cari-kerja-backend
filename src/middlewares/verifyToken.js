const { UnauthorizedError, ForbiddenError } = require("../helpers/errors");
const { sendResponse } = require("../helpers/utils/response");
const { getToken, verifyAccessToken } = require("../helpers/auth/jwt_helper");
const { ERROR } = require("../helpers/http-status/status_code");
const wrapper = require("../helpers/utils/wrapper");

const verifyToken = async (req, res, next) => {
  const result = { err: null, data: null };

  // 1. Coba ambil dari Authorization
  let token = getToken(req.headers["authorization"]);

  // 2. Kalau tidak ada, ambil dari cookies
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

  req.userMeta = checkedToken.data;
  next();
};

module.exports = verifyToken;
