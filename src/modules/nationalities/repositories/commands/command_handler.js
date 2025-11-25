const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const addNationality = async (payload) => {
  return domain.addNationality(payload);
};

const updateNationality = async (payload) => {
  return domain.updateNationality(payload);
};

const deleteNationality = async (payload) => {
  return domain.deleteNationality(payload);
};

module.exports = {
  addNationality,
  updateNationality,
  deleteNationality,
};
