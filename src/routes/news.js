const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const newsHandler = require("../modules/news/handlers/api_handler");
const { uploadNewsCover } = require("../middlewares/uploader");
const { validateUploadedMagicBytes } = require("../helpers/fraud/magic_bytes");

const adminRoles = [3, 4];

module.exports = (server) => {
  // ── Public ──────────────────────────────────────────────────────────────
  server.get("/api/v1/news", newsHandler.listPublicNews);
  server.get("/api/v1/news-categories", newsHandler.listNewsCategories);
  server.get("/api/v1/news/:slug", newsHandler.getPublicNews);

  // ── Admin news ──────────────────────────────────────────────────────────
  server.get(
    "/api/v1/admin/news",
    verifyToken,
    verifyRole(adminRoles),
    newsHandler.listAdminNews
  );
  server.get(
    "/api/v1/admin/news/:id",
    verifyToken,
    verifyRole(adminRoles),
    newsHandler.getAdminNews
  );
  server.post(
    "/api/v1/admin/news",
    verifyToken,
    verifyRole(adminRoles),
    newsHandler.createNews
  );
  server.put(
    "/api/v1/admin/news/:id",
    verifyToken,
    verifyRole(adminRoles),
    newsHandler.updateNews
  );
  server.post(
    "/api/v1/admin/news/:id/cover",
    verifyToken,
    verifyRole(adminRoles),
    uploadNewsCover.single("cover"),
    validateUploadedMagicBytes(),
    newsHandler.uploadCover
  );
  server.put(
    "/api/v1/admin/news/:id/publish",
    verifyToken,
    verifyRole(adminRoles),
    newsHandler.publishNews
  );
  server.put(
    "/api/v1/admin/news/:id/archive",
    verifyToken,
    verifyRole(adminRoles),
    newsHandler.archiveNews
  );
  server.delete(
    "/api/v1/admin/news/:id",
    verifyToken,
    verifyRole(adminRoles),
    newsHandler.deleteNews
  );

  // ── Admin categories ────────────────────────────────────────────────────
  server.post(
    "/api/v1/admin/news-categories",
    verifyToken,
    verifyRole(adminRoles),
    newsHandler.createCategory
  );
  server.put(
    "/api/v1/admin/news-categories/:id",
    verifyToken,
    verifyRole(adminRoles),
    newsHandler.updateCategory
  );
  server.delete(
    "/api/v1/admin/news-categories/:id",
    verifyToken,
    verifyRole(adminRoles),
    newsHandler.deleteCategory
  );
};
