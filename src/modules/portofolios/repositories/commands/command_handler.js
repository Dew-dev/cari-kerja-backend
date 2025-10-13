const PortofoliosDomain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

// Inisialisasi koneksi DB
const db = new DB(config.get("/postgresqlUrl"));
const domain = new PortofoliosDomain(db);

/**
 * Command handler untuk Portofolios
 */

// INSERT Portofolio
const insertPortofolios = async (payload) => {
  return domain.insertOne(payload);
};

// UPDATE Portofolio
const updatePortofolios = async (payload) => {
  return domain.updateOne(payload);
};

// DELETE Portofolio
const deletePortofolios = async (payload) => {
  return domain.deleteOne(payload);
};

module.exports = {
  insertPortofolios,
  updatePortofolios,
  deletePortofolios
};
