const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const addCertification = async (payload) => {
  return domain.addCertification(payload);
};

const updateCertification = async (payload) => {
  return domain.updateCertification(payload);
};

const deleteCertification = async (payload) => {
  return domain.deleteCertification(payload);
};

module.exports = {
  addCertification,
  updateCertification,
  deleteCertification,
};
