const WorkerExperienceDomain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

// Inisialisasi koneksi DB
const db = new DB(config.get("/postgresqlUrl"));
const domain = new WorkerExperienceDomain(db);

/**
 * Command handler untuk Work Experience
 */

// INSERT work experience
const insertWorkExperience = async (payload) => {
  return domain.insertOne(payload);
};

// UPDATE work experience
const updateWorkExperience = async (payload) => {
  return domain.updateOne(payload);
};

// DELETE work experience
const deleteWorkExperience = async (payload) => {
  return domain.deleteOne(payload);
};

module.exports = {
  insertWorkExperience,
  updateWorkExperience,
  deleteWorkExperience
};
