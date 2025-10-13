const EducationsDomain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

// Inisialisasi koneksi DB
const db = new DB(config.get("/postgresqlUrl"));
const domain = new EducationsDomain(db);

/**
 * Command handler untuk Educations
 */

// INSERT Educations
const insertEducations = async (payload) => {
  return domain.insertOne(payload);
};

// UPDATE Educations
const updateEducations = async (payload) => {
  return domain.updateOne(payload);
};

// DELETE Educations
const deleteEducations = async (payload) => {
  return domain.deleteOne(payload);
};

module.exports = {
  insertEducations,
  updateEducations,
  deleteEducations
};
