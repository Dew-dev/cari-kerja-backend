const verifyToken = require("../middlewares/verifyToken");
const workerHandler = require("../modules/workers/handlers/api_handler");
const { uploadAvatarWorker } = require("../middlewares/uploader");

module.exports = (server) => {
  server.get(
    "/api/v1/users/workers/me",
    verifyToken,
    workerHandler.getWorkerByUserId
  );
  server.put(
    "/api/v1/users/:user_id/workers/:id",
    verifyToken,
    uploadAvatarWorker.single("avatar"),
    workerHandler.updateOneWorker
  );
  server.put(
    "/api/v1/users/workers/me",
    verifyToken,
    uploadAvatarWorker.single("avatar"),
    workerHandler.updateSelfWorker
  );
};
