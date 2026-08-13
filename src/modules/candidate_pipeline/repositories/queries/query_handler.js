const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const getStages = async (payload) => domain.getStages(payload);
const getPipelineCandidates = async (payload) => domain.getPipelineCandidates(payload);
const getPipelineAnalytics = async (payload) => domain.getPipelineAnalytics(payload);
const getApplicationTimeline = async (payload) => domain.getApplicationTimeline(payload);

module.exports = {
  getStages,
  getPipelineCandidates,
  getPipelineAnalytics,
  getApplicationTimeline,
};
