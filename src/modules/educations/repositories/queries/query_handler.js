const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

// GET ALL Educations by Worker ID
const getAllEducationsByWorkerId = async (payload) => {
  return domain.getAllEducationsByWorkerId(payload);
};

// GET ONE Educations by ID
const getEducationsById = async (payload) => {
  return domain.getEducationsById(payload);
};

module.exports = {
  getAllEducationsByWorkerId,
  getEducationsById,
};
