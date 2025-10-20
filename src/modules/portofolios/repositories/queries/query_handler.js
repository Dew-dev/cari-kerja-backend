const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

// GET ALL Portofolios by Worker ID
const getAllPortfoliosByWorkerId = async (payload) => {
  return domain.getAllPortfoliosByWorkerId(payload);
};

module.exports = {
  getAllPortfoliosByWorkerId,
};
