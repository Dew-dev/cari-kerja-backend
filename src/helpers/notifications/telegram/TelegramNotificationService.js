const axios = require("axios");
const config = require("../../../config/global_config");
const logger = require("../../utils/logger");

const ctx = "TelegramNotificationService";

/**
 * Sole HTTP client for Telegram Bot API sendMessage.
 * Do not mix with email/SMTP.
 */
class TelegramNotificationService {
  constructor() {
    this.token = config.get("/telegramBot/token");
    this.apiBase = (config.get("/telegramBot/apiBase") || "https://api.telegram.org").replace(
      /\/$/,
      ""
    );
  }

  isConfigured() {
    return Boolean(this.token);
  }

  getSendUrl() {
    return `${this.apiBase}/bot${this.token}/sendMessage`;
  }

  /**
   * @param {{ chatId: string|number, text: string, parseMode?: string }} params
   */
  async sendMessage({ chatId, text, parseMode = "HTML" }) {
    if (!this.isConfigured()) {
      throw new Error("TELEGRAM_BOT_TOKEN is not configured");
    }
    if (!chatId) {
      throw new Error("chatId is required");
    }
    if (!text || !String(text).trim()) {
      throw new Error("text is required");
    }

    const started = Date.now();
    try {
      const response = await axios.post(
        this.getSendUrl(),
        {
          chat_id: chatId,
          text: String(text).slice(0, 4096),
          parse_mode: parseMode,
          disable_web_page_preview: true,
        },
        { timeout: 15000 }
      );

      if (!response.data?.ok) {
        throw new Error(
          response.data?.description || "Telegram API returned not ok"
        );
      }

      return {
        ok: true,
        messageId: response.data.result?.message_id,
        durationMs: Date.now() - started,
      };
    } catch (err) {
      const description =
        err.response?.data?.description || err.message || "Telegram send failed";
      logger.error(ctx, "sendMessage failed", "TelegramNotificationService", {
        description,
        status: err.response?.status,
      });
      const error = new Error(description);
      error.durationMs = Date.now() - started;
      throw error;
    }
  }
}

module.exports = new TelegramNotificationService();
module.exports.TelegramNotificationService = TelegramNotificationService;
