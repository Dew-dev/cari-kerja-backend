const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const getNationality = async (payload) => {
  return domain.getOneNationality(payload);
};

const getAllNationalities = async (payload) => {
  return domain.getAllNationalities(payload);
};

module.exports = {
  getNationality,
  getAllNationalities,
};
