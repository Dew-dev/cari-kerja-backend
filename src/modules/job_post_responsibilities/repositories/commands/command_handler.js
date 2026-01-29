const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

// Inisialisasi koneksi DB
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const insertJobPostResponsibility = async (payload) => {
  return domain.insertOne(payload);
};

const updateJobPostResponsibility = async (payload) => {
  return domain.updateOne(payload);
};

const deleteJobPostResponsibility = async (payload) => {
  return domain.deleteOne(payload);
};

module.exports = {
  insertJobPostResponsibility,
  updateJobPostResponsibility,
  deleteJobPostResponsibility
};
