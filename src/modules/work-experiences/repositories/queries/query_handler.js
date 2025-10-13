const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

// GET ALL Work Experiences by Worker ID
const getAllWorkExperiencesByWorkerId = async (payload) => {
  return domain.getAllWorkExperiencesByWorkerId(payload);
};

// GET ONE Work Experience by ID
const getWorkExperienceById = async (payload) => {
  return domain.getWorkExperienceById(payload);
};

module.exports = {
  getAllWorkExperiencesByWorkerId,
  getWorkExperienceById,
};
