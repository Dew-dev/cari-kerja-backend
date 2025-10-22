const basicAuth = require("../middlewares/basicAuth");
const verifyToken = require("../middlewares/verifyToken");
const userHandler = require("../modules/users/handlers/api_handler");
const { authGoogle, authGoogleCallback } = require("../helpers/auth/google_oauth");

module.exports = (server) => {
  server.post("/api/v1/users/register-worker", basicAuth.isAuthenticated, userHandler.registerWorker);
  server.post("/api/v1/users/register-recruiter", basicAuth.isAuthenticated, userHandler.registerRecruiter);
  server.put("/api/v1/users/update-user/:id", basicAuth.isAuthenticated, userHandler.updateOneUser);
  server.post("/api/v1/users/login", basicAuth.isAuthenticated, userHandler.login);
  server.get("/api/v1/users/google", authGoogle);
  server.get("/api/v1/users/google/callback", authGoogleCallback, userHandler.loginWithGoogle);
  server.delete("/api/v1/users/logout", verifyToken, userHandler.logout);
  server.put("/api/v1/users/refresh-token", basicAuth.isAuthenticated, userHandler.refreshToken);
  server.get("/api/v1/users/:id", verifyToken, userHandler.getUserById);
  server.delete("/api/v1/users/:id", verifyToken, userHandler.deleteUser);
};
