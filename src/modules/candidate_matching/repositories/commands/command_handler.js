const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const computeApplicationMatch = async (payload) => domain.computeApplicationMatch(payload);
const rematchJobPost = async (payload) => domain.rematchJobPost(payload);
const backfillAllApplications = async () => domain.backfillAllApplications();
const reindexElasticsearchEmbeddings = async () => domain.reindexElasticsearchEmbeddings();

module.exports = {
  computeApplicationMatch,
  rematchJobPost,
  backfillAllApplications,
  reindexElasticsearchEmbeddings,
};
