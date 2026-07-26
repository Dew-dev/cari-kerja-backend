const telegramHandler = require("../modules/telegram/handlers/api_handler");

module.exports = (server) => {
  server.post("/api/v1/telegram/webhook", telegramHandler.handleWebhook);
};
