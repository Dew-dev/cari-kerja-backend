const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const addEmploymentType = async (payload) => {
  return domain.addEmploymentType(payload);
};

const updateEmploymentType = async (payload) => {
  return domain.updateEmploymentType(payload);
};

const deleteEmploymentType = async (payload) => {
  return domain.deleteEmploymentType(payload);
};

module.exports = {
  addEmploymentType,
  updateEmploymentType,
  deleteEmploymentType,
};
