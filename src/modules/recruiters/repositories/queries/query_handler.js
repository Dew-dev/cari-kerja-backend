const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const getRecruiterByUserId = async (payload) => {
  return domain.getRecruiterByUserId(payload);
};

const getAllRecruitersByIndustry = async () => {
  return domain.getAllRecruitersByIndustry();
};

const getAllCompanies = async (payload) => {
  return domain.getAllCompanies(payload);
};

module.exports = {
  getRecruiterByUserId,
  getAllRecruitersByIndustry,
  getAllCompanies,
};
