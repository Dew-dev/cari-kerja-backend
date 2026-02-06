const ContactUsDomain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new ContactUsDomain(db);

const createContactMessage = async (payload) => {
  return domain.createContactMessage(payload);
};

const deleteContactMessage = async (payload) => {
  return domain.deleteContactMessage(payload);
};

module.exports = {
  createContactMessage,
  deleteContactMessage,
};
