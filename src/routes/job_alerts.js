const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const jobAlertsHandler = require("../modules/job_alerts/handlers/api_handler");

const workerRoles = [1, 3];

module.exports = (server) => {
  server.get(
    "/api/v1/workers/me/job-alerts",
    verifyToken,
    verifyRole(workerRoles),
    jobAlertsHandler.getJobAlerts,
  );
  server.put(
    "/api/v1/workers/me/job-alerts",
    verifyToken,
    verifyRole(workerRoles),
    jobAlertsHandler.updateJobAlerts,
  );
};
