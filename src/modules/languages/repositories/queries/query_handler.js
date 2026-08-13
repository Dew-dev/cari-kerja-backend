const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const getAllLanguagesByWorkerId = async (payload) => {
  return domain.getAllLanguagesByWorkerId(payload);
};

const getAllMasterLanguages = async (payload) => {
  return domain.getAllMasterLanguages(payload);
};

module.exports = {
  getAllLanguagesByWorkerId,
  getAllMasterLanguages,
};
