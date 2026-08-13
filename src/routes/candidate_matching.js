const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const matchingHandler = require("../modules/candidate_matching/handlers/api_handler");

const recruiterRoles = [2];

module.exports = (server) => {
  server.get(
    "/api/v1/job-applications/:id/match",
    verifyToken,
    verifyRole(recruiterRoles),
    matchingHandler.getApplicationMatch,
  );

  server.post(
    "/api/v1/job-posts/:id/rematch",
    verifyToken,
    verifyRole(recruiterRoles),
    matchingHandler.rematchJobPost,
  );
};
