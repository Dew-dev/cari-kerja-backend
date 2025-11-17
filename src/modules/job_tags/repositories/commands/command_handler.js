const Domain = require("./domain.js");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const createJobPostTag = async (payload) => {
  return domain.createJobPostTag(payload);
};

const deleteJobPostTag = async (payload) => {
  return domain.deleteJobPostTag(payload);
};

const createJobTag = async (payload) => {
  return domain.createJobTag(payload);
};

module.exports = {
  createJobPostTag,
  deleteJobPostTag,
  createJobTag,
};
