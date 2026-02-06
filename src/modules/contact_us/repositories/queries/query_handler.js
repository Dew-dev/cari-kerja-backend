const ContactUsQueryDomain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new ContactUsQueryDomain(db);

const getContactMessages = async (payload) => {
  return domain.getContactMessages(payload);
};

const getContactMessageById = async (payload) => {
  return domain.getContactMessageById(payload);
};

module.exports = {
  getContactMessages,
  getContactMessageById,
};
