const config = require("../../config/global_config");

const storeCookie = (res, cookieName, token) => {
  return res.cookie(cookieName, token, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    secure: config.get("/env") === "production",
    sameSite: "none",
  });
};

const deleteCookie = (res, cookieName) => {
  return res.clearCookie(cookieName);
};

module.exports = { storeCookie, deleteCookie };
