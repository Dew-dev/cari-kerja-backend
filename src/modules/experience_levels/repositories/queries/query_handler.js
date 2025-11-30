const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const getExperienceLevel = async (payload) => {
  return domain.getOneExperienceLevel(payload);
};

const getAllExperienceLevels = async (payload) => {
  return domain.getAllExperienceLevels(payload);
};

module.exports = {
  getExperienceLevel,
  getAllExperienceLevels,
};
