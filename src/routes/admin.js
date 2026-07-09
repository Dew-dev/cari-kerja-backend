const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const adminHandler = require("../modules/admin/handlers/api_handler");

// super_admin (3) and admin (4)
const allowedRoles = [3, 4];

module.exports = (server) => {
  server.get("/api/v1/admin/stats", verifyToken, verifyRole(allowedRoles), adminHandler.getDashboardStats);
  server.get("/api/v1/admin/users", verifyToken, verifyRole(allowedRoles), adminHandler.getUsers);
  server.put("/api/v1/admin/users/:id/status", verifyToken, verifyRole(allowedRoles), adminHandler.updateUserStatus);
  server.get("/api/v1/admin/employers", verifyToken, verifyRole(allowedRoles), adminHandler.getEmployers);
  server.put("/api/v1/admin/employers/:id/verify", verifyToken, verifyRole(allowedRoles), adminHandler.verifyEmployer);
  server.get("/api/v1/admin/jobs", verifyToken, verifyRole(allowedRoles), adminHandler.getJobs);
  server.put("/api/v1/admin/jobs/:id/status", verifyToken, verifyRole(allowedRoles), adminHandler.updateJobStatus);
  server.get("/api/v1/admin/applications", verifyToken, verifyRole(allowedRoles), adminHandler.getApplications);
};
