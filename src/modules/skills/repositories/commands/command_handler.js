const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const addSkill = async (payload) => {
  return domain.addSkill(payload);
};

const updateSkill = async (payload) => {
  return domain.updateSkill(payload);
};

const deleteSkill = async (payload) => {
  return domain.deleteSkill(payload);
};

module.exports = {
  addSkill,
  updateSkill,
  deleteSkill,
};
