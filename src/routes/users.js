const basicAuth = require("../middlewares/basicAuth");
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const userHandler = require("../modules/users/handlers/api_handler");
const { authGoogle, authGoogleCallback } = require("../helpers/auth/google_oauth");
const forgotPasswordLimiter = require("../middlewares/rateLimitForgotPassword");

// User account management (login, logout, register, password/email flows) is
// intentionally NOT role-gated here: it must remain reachable by every role
// (worker, recruiter, super_admin, admin) since it is how each of them
// authenticates and manages their own account. `getUserById` is protected by
// an ownership check inside the handler (self or super_admin) instead.
// super_admin (3) and admin (4) — deleting another user's account is an
// account-management action, not a worker/recruiter feature.
const userManagementRoles = [3, 4];

module.exports = (server) => {
  server.post("/api/v1/users/register-worker", basicAuth.isAuthenticated, userHandler.registerWorker);
  server.post("/api/v1/users/register-recruiter", basicAuth.isAuthenticated, userHandler.registerRecruiter);
  server.put("/api/v1/users/update-user/:id", basicAuth.isAuthenticated, userHandler.updateOneUser);
  server.post("/api/v1/users/login", basicAuth.isAuthenticated, userHandler.login);
  server.get("/api/v1/users/google", authGoogle);
  server.get("/api/v1/users/google/callback", authGoogleCallback, userHandler.loginWithGoogle);
  server.get("/api/v1/users/telegram", (req, res) => {
    const config = require("../config/global_config");
    const clientId = config.get("/telegramAuth/clientId");
    const redirectUri = config.get("/telegramAuth/redirectUri");
    const { role_id, origin } = req.query;
    const state = JSON.stringify({ role_id: Number(role_id) || 1, origin });
    const authUrl = `https://oauth.telegram.org/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid+profile&state=${encodeURIComponent(state)}`;
    return res.redirect(authUrl);
  });
  server.get("/api/v1/users/telegram/callback", userHandler.loginWithTelegram);
  server.post("/api/v1/users/login/telegram", userHandler.loginWithTelegram);
  server.delete("/api/v1/users/logout", verifyToken, userHandler.logout);
  server.put("/api/v1/users/refresh-token", basicAuth.isAuthenticated, userHandler.refreshToken);
  server.get("/api/v1/users/:id", verifyToken, userHandler.getUserById);
  server.delete(
    "/api/v1/users/:id",
    verifyToken,
    verifyRole(userManagementRoles),
    userHandler.deleteUser
  );
  server.post("/api/v1/auth/forgot-password", forgotPasswordLimiter, userHandler.forgotPassword);
  server.post("/api/v1/auth/reset-password", userHandler.resetPassword);

  server.post(
    "/api/v1/auth/change-password",
    verifyToken, // wajib login
    userHandler.changePassword,
  );
  server.post(
    "/api/v1/auth/change-email",
    verifyToken,
    userHandler.changeEmail,
  );
  server.post(
    "/api/v1/auth/verify-email/send",
    verifyToken,
    userHandler.sendVerifyEmail,
  );

  server.get("/api/v1/auth/verify-email", userHandler.verifyEmail);
  server.post("/api/v1/auth/verify-email/resend", userHandler.resendVerifyEmail);

};
