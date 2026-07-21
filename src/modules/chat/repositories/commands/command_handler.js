const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const startConversation = async (payload) => {
  return domain.startConversation(payload);
};

const sendMessage = async (payload) => {
  return domain.sendMessage(payload);
};

const markAsRead = async (payload) => {
  return domain.markAsRead(payload);
};

const blockUser = async (payload) => {
  return domain.blockUser(payload);
};

const unblockUser = async (payload) => {
  return domain.unblockUser(payload);
};

const listBlocks = async (payload) => {
  return domain.listBlocks(payload);
};

const reportConversation = async (payload) => {
  return domain.reportConversation(payload);
};

module.exports = {
  startConversation,
  sendMessage,
  markAsRead,
  blockUser,
  unblockUser,
  listBlocks,
  reportConversation,
};
