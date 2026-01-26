const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const getCategory = async (payload) => {
  return domain.getOneCategory(payload);
};

const getAllCategories = async (payload) => {
  return domain.getAllCategories(payload);
};

const getAllCategoriesWithJobcount = async () => {
  return domain.getAllCategoriesWithJobcount();
}

module.exports = {
  getCategory,
  getAllCategories,
  getAllCategoriesWithJobcount
};
