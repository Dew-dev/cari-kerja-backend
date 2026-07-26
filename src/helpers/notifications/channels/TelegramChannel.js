const Channel = require("./Channel");
const { addTelegramJob } = require("../../queues/telegram.queue");

class TelegramChannel extends Channel {
  get name() {
    return "telegram";
  }

  canDeliver(user) {
    if (user?.login_provider !== "telegram") return false;
    return Boolean(user?.telegram_chat_id);
  }

  async send({ user, type, data, rendered }) {
    if (!this.canDeliver(user)) {
      return { skipped: true, reason: "telegram_not_available" };
    }
    if (!rendered?.telegram?.text) {
      return { skipped: true, reason: "no_telegram_render" };
    }
    await addTelegramJob({
      chatId: String(user.telegram_chat_id),
      text: rendered.telegram.text,
      parseMode: rendered.telegram.parseMode || "HTML",
      userId: user.id || user.user_id || null,
      notificationType: type,
      recipient_id: data?.recipient_id || rendered.telegram.recipient_id,
    });
    return { queued: true, channel: this.name };
  }
}

module.exports = TelegramChannel;
