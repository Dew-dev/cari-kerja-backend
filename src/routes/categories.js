const categoryHandler = require("../modules/categories/handlers/api_handler");

module.exports = (server) => {
  server.get(
    "/api/v1/categories",
    categoryHandler.getAllCategories
  );
  server.get(
    "/api/v1/categories/:id",
    categoryHandler.getCategory
  );
  server.put(
    "/api/v1/categories/:id",
    categoryHandler.updateCategory
  );
  server.post("/api/v1/categories", categoryHandler.addCategory);
  server.delete(
    "/api/v1/categories/:id",
    categoryHandler.deleteCategory
  );
};
