const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const addResume = async (payload) => {
  return domain.addResume(payload);
};

const updateResume = async (payload) => {
  return domain.updateResume(payload);
};

const deleteResume = async (payload) => {
  return domain.deleteResume(payload);
};

module.exports = {
  addResume,
  updateResume,
  deleteResume,
};
