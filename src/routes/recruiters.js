const verifyToken = require("../middlewares/verifyToken");
const recruiterHandler = require("../modules/recruiters/handlers/api_handler");
const { uploadAvatarRecruiter } = require("../middlewares/uploader");

module.exports = (server) => {
  server.get(
    "/api/v1/recruiters/companies",
    recruiterHandler.getAllCompanies
  );

  server.get(
    "/api/v1/recruiters/grouped-by-industry",
    recruiterHandler.getAllRecruitersByIndustry
  );

  server.get(
    "/api/v1/users/:user_id/recruiters",
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

  server.patch(
    "/api/v1/users/recruiters/vip",
    verifyToken,
    recruiterHandler.updateRecruiterVipSelf
  );
};
