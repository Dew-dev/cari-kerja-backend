const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const addGender = async (payload) => {
  return domain.addGender(payload);
};

const updateGender = async (payload) => {
  return domain.updateGender(payload);
};

const deleteGender = async (payload) => {
  return domain.deleteGender(payload);
};

module.exports = {
  addGender,
  updateGender,
  deleteGender,
};
