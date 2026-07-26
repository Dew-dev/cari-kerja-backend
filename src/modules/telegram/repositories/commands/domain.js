const Command = require("./command");
const config = require("../../../../config/global_config");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { UnauthorizedError } = require("../../../../helpers/errors");
const {
  verifyTelegramStartPayload,
} = require("../../../../helpers/auth/telegram_profile");
const telegramService = require("../../../../helpers/notifications/telegram/TelegramNotificationService");

const ctx = "Telegram-Command-Domain";

class TelegramDomain {
  constructor(db) {
    this.command = new Command(db);
  }

  async handleWebhook({ update, secretToken }) {
    const expected = config.get("/telegramBot/webhookSecret") || "";
    if (!expected || secretToken !== expected) {
      return wrapper.error(new UnauthorizedError("Invalid webhook secret"));
    }

    try {
      if (update?.my_chat_member) {
        await this._handleChatMember(update.my_chat_member);
        return wrapper.data({ handled: "my_chat_member" });
      }

      const message = update?.message || update?.edited_message;
      if (!message?.text || !message?.chat) {
        return wrapper.data({ handled: "ignored" });
      }

      const chatId = message.chat.id;
      const fromUsername = message.from?.username
        ? String(message.from.username).toLowerCase()
        : null;
      const text = String(message.text).trim();

      if (text === "/stop" || text.startsWith("/stop ")) {
        await this.command.unlinkTelegramBotByChatId(chatId);
        await this._safeReply(
          chatId,
          "Notifikasi Telegram dimatikan. Kamu bisa mengaktifkannya lagi dari profil Cari Kerja."
        );
        return wrapper.data({ handled: "stop" });
      }

      if (text.startsWith("/start")) {
        const parts = text.split(/\s+/);
        const payload = parts[1] || "";
        if (!payload) {
          await this._safeReply(
            chatId,
            "Untuk mengaktifkan notifikasi, buka tombol “Aktifkan notifikasi Telegram” di aplikasi Cari Kerja, jangan Start dari sini saja."
          );
          return wrapper.data({ handled: "start_missing_payload" });
        }
        const verified = verifyTelegramStartPayload(payload);
        if (!verified?.userId) {
          await this._safeReply(
            chatId,
            "Link aktivasi tidak valid atau sudah kedaluwarsa. Buka ulang tombol di aplikasi Cari Kerja."
          );
          return wrapper.data({ handled: "start_invalid" });
        }

        const result = await this.command.linkTelegramBot({
          userId: verified.userId,
          chatId,
          username: fromUsername,
        });
        const linked = result?.rows?.[0]?.id;
        if (!linked) {
          await this._safeReply(
            chatId,
            "Akun Telegram login tidak ditemukan. Login dulu dengan Telegram di Cari Kerja, lalu coba lagi."
          );
          return wrapper.data({ handled: "start_user_not_found" });
        }

        await this._safeReply(
          chatId,
          "Notifikasi Telegram aktif. Kamu akan menerima job alert dan update lamaran di sini."
        );
        return wrapper.data({ handled: "start_ok", userId: verified.userId });
      }

      return wrapper.data({ handled: "ignored" });
    } catch (err) {
      logger.error(ctx, "handleWebhook", "webhook processing failed", err);
      return wrapper.data({ handled: "error" });
    }
  }

  async _handleChatMember(memberUpdate) {
    const chatId = memberUpdate?.chat?.id;
    const status = memberUpdate?.new_chat_member?.status;
    if (!chatId) return;
    if (status === "kicked" || status === "left") {
      await this.command.unlinkTelegramBotByChatId(chatId);
    }
  }

  async _safeReply(chatId, text) {
    try {
      if (!telegramService.isConfigured()) return;
      await telegramService.sendMessage({ chatId, text, parseMode: "HTML" });
    } catch (err) {
      logger.error(ctx, "_safeReply", "reply failed", err);
    }
  }
}

module.exports = TelegramDomain;
