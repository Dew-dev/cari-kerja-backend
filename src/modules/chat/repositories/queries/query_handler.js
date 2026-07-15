const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const getConversations = async (payload) => {
  return domain.getConversations(payload);
};

const getConversationById = async (payload) => {
  return domain.getConversationById(payload);
};

const getMessages = async (payload) => {
  return domain.getMessages(payload);
};

module.exports = {
  getConversations,
  getConversationById,
  getMessages,
};
