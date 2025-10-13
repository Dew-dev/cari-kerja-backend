const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

// GET ALL Portofolios by Worker ID
const getAllPortofoliosByWorkerId = async (payload) => {
  return domain.getAllPortofoliosByWorkerId(payload);
};

module.exports = {
  getAllPortofoliosByWorkerId
};
