const storeCookie = (res, cookieName, token) => {
  // SameSite=None is required for cross-origin FE↔API (e.g. localhost:5173 → API).
  // Browsers reject SameSite=None without Secure; Chromium allows Secure on localhost.
  return res.cookie(cookieName, token, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    secure: true,
    sameSite: "none",
  });
};

const deleteCookie = (res, cookieName) => {
  return res.clearCookie(cookieName, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
};

module.exports = { storeCookie, deleteCookie };
