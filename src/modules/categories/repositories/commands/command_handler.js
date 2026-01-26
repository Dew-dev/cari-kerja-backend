const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const addCategory = async (payload) => {
  return domain.addCategory(payload);
};

const updateCategory = async (payload) => {
  return domain.updateCategory(payload);
};

const deleteCategory = async (payload) => {
  return domain.deleteCategory(payload);
};

module.exports = {
  addCategory,
  updateCategory,
  deleteCategory,
};
