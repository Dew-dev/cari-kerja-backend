const PaymentCommandDomain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new PaymentCommandDomain(db);

const createInvoice = async (payload) => {
  return domain.createInvoice(payload);
};

const handleXenditWebhook = async (payload) => {
  return domain.handleXenditWebhook(payload);
};

const applySinglePostToJob = async (payload) => {
  return domain.applySinglePostToJob(payload);
};

module.exports = {
  createInvoice,
  handleXenditWebhook,
  applySinglePostToJob,
};
