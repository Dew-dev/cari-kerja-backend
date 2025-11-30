const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);
const getSavedJobsByWorkerId = async (payload) => {
  return domain.getSavedJobsByWorkerId(payload);
};

const getSavedJobsById = async (payload) => {
  return domain.getSavedJobsById(payload);
};

const getSavedJobs = async (payload) => {
  return domain.getSavedJobs(payload);
};

const getSavedJobsSelf = async (payload) => {
  return domain.getSavedJobsSelf(payload);
};

module.exports = {
  getSavedJobsByWorkerId,
  getSavedJobsById,
  getSavedJobs,
  getSavedJobsSelf
};
