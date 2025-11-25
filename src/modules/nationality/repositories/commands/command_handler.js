const LanguagesDomain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

// Inisialisasi koneksi DB
const db = new DB(config.get("/postgresqlUrl"));
const domain = new LanguagesDomain(db);

/**
 * Command handler untuk Languages
 */

// INSERT Languages
const insertLanguages = async (payload) => {
  return domain.insertOne(payload);
};

// UPDATE Languages
const updateLanguages = async (payload) => {
  return domain.updateOne(payload);
};

// DELETE Languages
const deleteLanguages = async (payload) => {
  return domain.deleteOne(payload);
};

module.exports = {
  insertLanguages,
  updateLanguages,
  deleteLanguages
};
