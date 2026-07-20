const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const createTemplate = async (payload) => domain.createTemplate(payload);
const updateTemplate = async (payload) => domain.updateTemplate(payload);
const deleteTemplate = async (payload) => domain.deleteTemplate(payload);
const bulkSend = async (payload) => domain.bulkSend(payload);
const updateWorkerPreferences = async (payload) => domain.updateWorkerPreferences(payload);
const unsubscribeByToken = async (payload) => domain.unsubscribeByToken(payload);

module.exports = {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  bulkSend,
  updateWorkerPreferences,
  unsubscribeByToken,
};
