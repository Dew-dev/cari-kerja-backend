const verifyToken = require("../middlewares/verifyToken");
const recruiterHandler = require("../modules/recruiters/handlers/api_handler");
const uploadAvatar = require("../middlewares/uploadAvatar");

module.exports = (server) => {
  server.get(
    "/api/v1/users/:user_id/recruiters",
    verifyToken,
    recruiterHandler.getRecruiterByUserId
  );
  server.put(
    "/api/v1/users/:user_id/recruiters/:id",
    verifyToken,
    recruiterHandler.updateOneRecruiter
  );
  server.put(
    "/api/v1/users/recruiters",
    verifyToken,
    uploadAvatar.single("avatar"),
    recruiterHandler.updateOneRecruiterSelf
  );
};
