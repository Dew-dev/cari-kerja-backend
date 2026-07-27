const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

module.exports = {
  list: (payload) => domain.list(payload),
  getById: (payload) => domain.getById(payload),
};
