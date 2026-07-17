const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const categoryHandler = require("../modules/categories/handlers/api_handler");

// Category mutations are admin-only. GET stays public so worker/recruiter
// UIs (and public job filters) can load category dropdowns without auth.
// super_admin (3) and admin (4) may create/update/delete categories.
const adminRoles = [3, 4];

module.exports = (server) => {
  server.get(
    "/api/v1/categories",
    categoryHandler.getAllCategories
  );
  server.get(
    "/api/v1/categories/jobcount",
    categoryHandler.getAllCategoriesWithJobcount
  );
  server.get(
    "/api/v1/categories/:id",
    categoryHandler.getCategory
  );
  server.put(
    "/api/v1/categories/:id",
    verifyToken,
    verifyRole(adminRoles),
    categoryHandler.updateCategory
  );
  server.post(
    "/api/v1/categories",
    verifyToken,
    verifyRole(adminRoles),
    categoryHandler.addCategory
  );
  server.delete(
    "/api/v1/categories/:id",
    verifyToken,
    verifyRole(adminRoles),
    categoryHandler.deleteCategory
  );
};
