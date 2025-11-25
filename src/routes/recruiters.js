const verifyToken = require("../middlewares/verifyToken");
const recruiterHandler = require("../modules/recruiters/handlers/api_handler");
const { uploadAvatarRecruiter } = require("../middlewares/uploader");

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
    uploadAvatarRecruiter.single("avatar"),
    recruiterHandler.updateOneRecruiterSelf
  );
};
