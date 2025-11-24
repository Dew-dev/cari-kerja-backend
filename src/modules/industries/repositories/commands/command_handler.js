const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const addIndustry = async (payload) => {
  return domain.addIndustry(payload);
};

const updateIndustry = async (payload) => {
  return domain.updateIndustry(payload);
};

const deleteIndustry = async (payload) => {
  return domain.deleteIndustry(payload);
};

module.exports = {
  addIndustry,
  updateIndustry,
  deleteIndustry,
};
