const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const getWorkerByUserId = async (payload) => {
  return domain.getWorkerByUserId(payload);
};

const getWorkerById = async (payload) => {
  return domain.getWorkerById(payload);
};

const getWorkers = async (payload) => {
  return domain.getWorkers(payload);
};

module.exports = {
  getWorkerByUserId,
  getWorkerById,
  getWorkers,
};
