const commandHandler = require("../repositories/commands/command_handler");
const { sendResponse } = require("../../../helpers/utils/response");
const { UnauthorizedError } = require("../../../helpers/errors");

/**
 * Telegram Bot webhook — public endpoint secured by secret token header.
 */
const handleWebhook = async (req, res) => {
  const result = await commandHandler.handleWebhook({
    update: req.body,
    secretToken: req.headers["x-telegram-bot-api-secret-token"],
  });
  if (result.err && result.err instanceof UnauthorizedError) {
    return sendResponse(result, res, 401);
  }
  // Acknowledge updates to Telegram even if business handling was a no-op.
  return res.status(200).send({ ok: true });
};

module.exports = { handleWebhook };
