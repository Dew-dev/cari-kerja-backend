const collection = "users";

class Command {
  constructor(db) {
    this.db = db;
  }

  async linkTelegramBot({ userId, chatId, username }) {
    return this.db.executeQuery(
      `UPDATE ${collection}
       SET telegram_chat_id = $2,
           telegram_notify_username = $3,
           telegram_bot_linked_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
         AND login_provider = 'telegram'
         AND deleted_at IS NULL
       RETURNING id`,
      [userId, String(chatId), username || null]
    );
  }

  async unlinkTelegramBotByChatId(chatId) {
    return this.db.executeQuery(
      `UPDATE ${collection}
       SET telegram_chat_id = NULL,
           telegram_bot_linked_at = NULL,
           updated_at = NOW()
       WHERE telegram_chat_id = $1
       RETURNING id`,
      [String(chatId)]
    );
  }
}

module.exports = Command;
