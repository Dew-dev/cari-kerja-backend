const config = require("../config/global_config");
const wrapper = require("../helpers/utils/wrapper");
const { UnauthorizedError } = require("../helpers/errors");
const validate = require("validate.js");

const isAuthenticated = async (req, res, next) => {
  const result = { err: null, data: null };
  let authValid = false;
  const header = req.headers.authorization;

  if (validate.isEmpty(header) || !header || !header.startsWith("Basic ")) {
    result.err = new UnauthorizedError("Basic authentication required");
    return wrapper.response(res, "fail", result);
  }

  const base64 = header.split(" ")[1];
  const decoded = Buffer.from(base64, "base64").toString("utf8");
  const [username, password] = decoded.split(":");
  const userDataName = config.get("/basicAuth/username");
  const userDataPassword = config.get("/basicAuth/password");
  if (userDataName === username && userDataPassword === password) {
    authValid = true;
  }

  if (!authValid) {
    result.err = new UnauthorizedError("Invalid basic credentials");
    return wrapper.response(res, "fail", result);
  }
  next();
};

module.exports = { isAuthenticated };
