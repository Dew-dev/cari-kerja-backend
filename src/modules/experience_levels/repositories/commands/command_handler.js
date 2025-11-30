const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const addExperienceLevel = async (payload) => {
  return domain.addExperienceLevel(payload);
};

const updateExperienceLevel = async (payload) => {
  return domain.updateExperienceLevel(payload);
};

const deleteExperienceLevel = async (payload) => {
  return domain.deleteExperienceLevel(payload);
};

module.exports = {
  addExperienceLevel,
  updateExperienceLevel,
  deleteExperienceLevel,
};
