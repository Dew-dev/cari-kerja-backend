const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const getOneCertification = async (payload) => {
  return domain.getOneCertification(payload);
};

const getAllCertifications = async (payload) => {
  return domain.getAllCertifications(payload);
};

module.exports = {
  getOneCertification,
  getAllCertifications,
};
