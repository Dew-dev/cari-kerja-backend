const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

module.exports = {
  listPublic: (payload) => domain.listPublic(payload),
  getPublicBySlug: (payload) => domain.getPublicBySlug(payload),
  listCategories: () => domain.listCategories(),
  listAdmin: (payload) => domain.listAdmin(payload),
  getAdminById: (payload) => domain.getAdminById(payload),
};
