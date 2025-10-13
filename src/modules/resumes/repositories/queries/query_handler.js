const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const getResume = async (payload) => {
  return domain.getResume(payload);
};

const getAllResumes = async (payload) => {
  return domain.getAllResumes(payload);
};

module.exports = {
  getResume,
  getAllResumes,
};
