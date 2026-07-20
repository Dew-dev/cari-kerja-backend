const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const listTemplates = async (payload) => domain.listTemplates(payload);
const listCampaigns = async (payload) => domain.listCampaigns(payload);
const getCampaign = async (payload) => domain.getCampaign(payload);
const getWorkerPreferences = async (payload) => domain.getWorkerPreferences(payload);

module.exports = {
  listTemplates,
  listCampaigns,
  getCampaign,
  getWorkerPreferences,
};
