const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const workerHandler = require("../modules/workers/handlers/api_handler");
const { uploadAvatarWorker } = require("../middlewares/uploader");

// Self-scoped worker profile routes (me / update own profile)
const workerRoles = [1, 3]; // worker (1), super_admin (3)

// Talent search / worker profile view — used by recruiters; workers may also
// view profiles when authenticated. Public (unauthenticated) access is blocked
// to prevent PII exposure (email, phone, resume, etc.).
const viewerRoles = [1, 2, 3]; // worker, recruiter, super_admin

// Recruiter talent directory listing
const recruiterRoles = [2, 3]; // recruiter (2), super_admin (3)

module.exports = (server) => {
  server.get(
    "/api/v1/workers",
    verifyToken,
    verifyRole(recruiterRoles),
    workerHandler.getWorkers
  );
  server.get(
    "/api/v1/workers/:id",
    verifyToken,
    verifyRole(viewerRoles),
    workerHandler.getWorkerById
  );
  server.get(
    "/api/v1/users/workers/me",
    verifyToken,
    verifyRole(workerRoles),
    workerHandler.getWorkerByUserId
  );
  server.put(
    "/api/v1/users/:user_id/workers/:id",
    verifyToken,
    verifyRole(workerRoles),
    uploadAvatarWorker.single("avatar"),
    workerHandler.updateOneWorker
  );
  server.put(
    "/api/v1/users/workers/me",
    verifyToken,
    verifyRole(workerRoles),
    uploadAvatarWorker.single("avatar"),
    workerHandler.updateSelfWorker
  );
};
