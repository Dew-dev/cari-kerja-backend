const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const getIndustry = async (payload) => {
  return domain.getOneIndustry(payload);
};

const getAllIndustries = async (payload) => {
  return domain.getAllIndustries(payload);
};

module.exports = {
  getIndustry,
  getAllIndustries,
};
