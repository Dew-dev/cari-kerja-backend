const WorkerSkillsDomain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

// Inisialisasi koneksi DB
const db = new DB(config.get("/postgresqlUrl"));
const domain = new WorkerSkillsDomain(db);

/**
 * Command handler untuk Worker Skills
 */

// INSERT worker skills
const insertWorkerSkills = async (payload) => {
  return domain.insertOne(payload);
};

// DELETE worker skills
const deleteWorkerSkills = async (payload) => {
  return domain.deleteOne(payload);
};

module.exports = {
  insertWorkerSkills,
  deleteWorkerSkills
};
