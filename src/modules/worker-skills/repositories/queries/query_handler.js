const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

// GET ALL Worker Skills by Worker ID
const getAllWorkerSkillsByWorkerId = async (payload) => {
  return domain.getAllWorkerSkillsByWorkerId(payload);
};

module.exports = {
  getAllWorkerSkillsByWorkerId
};
