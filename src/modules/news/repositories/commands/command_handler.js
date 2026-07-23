const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

module.exports = {
  createCategory: (payload) => domain.createCategory(payload),
  updateCategory: (payload) => domain.updateCategory(payload),
  deleteCategory: (payload) => domain.deleteCategory(payload),
  createNews: (payload) => domain.createNews(payload),
  updateNews: (payload) => domain.updateNews(payload),
  uploadCover: (payload) => domain.uploadCover(payload),
  publishNews: (payload) => domain.publishNews(payload),
  archiveNews: (payload) => domain.archiveNews(payload),
  deleteNews: (payload) => domain.deleteNews(payload),
};
