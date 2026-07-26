const EmailChannel = require("./channels/EmailChannel");
const TelegramChannel = require("./channels/TelegramChannel");
const SmsChannel = require("./channels/SmsChannel");
const PushChannel = require("./channels/PushChannel");
const WhatsAppChannel = require("./channels/WhatsAppChannel");
const { renderTelegramTemplate } = require("./templates/telegram");
const logger = require("../utils/logger");

const ctx = "NotificationService";

const DEFAULT_CHANNELS = ["email", "telegram"];

/**
 * Multi-channel notification dispatcher.
 * Business domains call notify(); they never talk to Telegram/Email APIs directly.
 */
class NotificationService {
  constructor() {
    this.channels = {
      email: new EmailChannel(),
      telegram: new TelegramChannel(),
      sms: new SmsChannel(),
      push: new PushChannel(),
      whatsapp: new WhatsAppChannel(),
    };
  }

  /**
   * @param {{
   *   user: object,
   *   type: string,
   *   data?: object,
   *   channels?: string[],
   *   email?: { to?: string, subject: string, html: string, recipient_id?: string } | null,
   * }} params
   */
  async notify({ user, type, data = {}, channels = DEFAULT_CHANNELS, email = null }) {
    if (!user || !type) {
      return { results: [], error: "user_and_type_required" };
    }

    const rendered = {
      email: email || null,
      telegram: null,
    };

    const wantsTelegram = channels.includes("telegram");
    if (wantsTelegram && this.channels.telegram.canDeliver(user)) {
      try {
        rendered.telegram = renderTelegramTemplate(type, {
          ...data,
          name: data.name || user.name || user.worker_name,
        });
      } catch (err) {
        logger.error(ctx, "telegram template render failed", type, err);
      }
    }

    const selected = channels
      .map((name) => this.channels[name])
      .filter(Boolean);

    const settled = await Promise.allSettled(
      selected.map(async (channel) => {
        if (!channel.canDeliver(user)) {
          return { channel: channel.name, skipped: true, reason: "cannot_deliver" };
        }
        // Email channel needs rendered.email; skip if producer omitted email payload
        if (channel.name === "email" && !rendered.email) {
          return { channel: channel.name, skipped: true, reason: "no_email_payload" };
        }
        try {
          const result = await channel.send({ user, type, data, rendered });
          return { channel: channel.name, ...result };
        } catch (err) {
          logger.error(ctx, `channel ${channel.name} failed`, type, err);
          return {
            channel: channel.name,
            failed: true,
            error: err.message,
          };
        }
      })
    );

    const results = settled.map((item) =>
      item.status === "fulfilled"
        ? item.value
        : { failed: true, error: item.reason?.message || "unknown" }
    );

    return { results };
  }
}

module.exports = new NotificationService();
module.exports.NotificationService = NotificationService;
