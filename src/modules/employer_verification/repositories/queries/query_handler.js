const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const getStatus = (payload) => domain.getStatus(payload);
const getDocTypes = () => domain.getDocTypes();
const listApplications = (payload) => domain.listApplications(payload);
const getApplicationById = (payload) => domain.getApplicationById(payload);
const listReactivationRequests = (payload) =>
  domain.listReactivationRequests(payload);

module.exports = {
  getStatus,
  getDocTypes,
  listApplications,
  getApplicationById,
  listReactivationRequests,
};
