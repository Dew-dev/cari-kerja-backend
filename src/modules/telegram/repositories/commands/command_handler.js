const TelegramDomain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new TelegramDomain(db);

const handleWebhook = async (payload) => domain.handleWebhook(payload);

module.exports = { handleWebhook };
