const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const getSkill = async (payload) => {
  return domain.getOneSkill(payload);
};

const getAllSkills = async (payload) => {
  return domain.getAllSkills(payload);
};

module.exports = {
  getSkill,
  getAllSkills,
};
