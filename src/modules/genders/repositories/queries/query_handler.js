const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const getGender = async (payload) => {
  return domain.getOneGender(payload);
};

const getAllGenders = async (payload) => {
  return domain.getAllGenders(payload);
};

module.exports = {
  getGender,
  getAllGenders,
};
