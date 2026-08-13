const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const jobTitlesHandler = require("../modules/job_titles/handlers/api_handler");

// Autocomplete for workers (profile) and recruiters (job posts / talent filter)
const jobTitleRoles = [1, 2, 3];

module.exports = (server) => {
  server.get(
    "/api/v1/job-titles",
    verifyToken,
    verifyRole(jobTitleRoles),
    jobTitlesHandler.listJobTitles
  );
  server.get(
    "/api/v1/job-titles/:id",
    verifyToken,
    verifyRole(jobTitleRoles),
    jobTitlesHandler.getJobTitle
  );
};
