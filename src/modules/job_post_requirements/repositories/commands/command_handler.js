const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

// Inisialisasi koneksi DB
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const insertJobPostRequirements = async (payload) => {
  return domain.insertOne(payload);
};

const updateJobPostRequirements = async (payload) => {
  return domain.updateOne(payload);
};

const deleteJobPostRequirements = async (payload) => {
  return domain.deleteOne(payload);
};

module.exports = {
  insertJobPostRequirements,
  updateJobPostRequirements,
  deleteJobPostRequirements
};
