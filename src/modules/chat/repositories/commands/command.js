const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { InternalServerError } = require("../../../../helpers/errors");
const pgConnection = require("../../../../helpers/databases/postgresql/connection");
const config = require("../../../../config/global_config");

const ctx = "Chat-Command";

class Command {
  constructor(db) {
    this.db = db;
    this.pgConfig = config.get("/postgresqlUrl");
  }

  async createConversation({ id, worker_id, recruiter_id, job_id }) {
    try {
      const query = `
        INSERT INTO conversations (id, worker_id, recruiter_id, job_id, status)
        VALUES ($1, $2, $3, $4, 'ACTIVE')
        RETURNING *
      `;
      const result = await this.db.executeQuery(query, [id, worker_id, recruiter_id, job_id || null]);
      if (!result || result.rows.length === 0) {
        return wrapper.error(new InternalServerError("Failed to create conversation"));
      }
      return wrapper.data(result.rows[0]);
    } catch (err) {
      logger.error(ctx, "createConversation failed", "command", err);
      return wrapper.error(new InternalServerError("Error creating conversation"));
    }
  }

  /**
   * Atomically insert a message and update the conversation in a single transaction.
   * @param {object} messageData  - { id, conversation_id, sender_id, message, type }
   * @param {number} senderRoleId - 1 = worker sender → increment recruiter_unread
   *                                2 = recruiter sender → increment worker_unread
   */
  async insertMessageWithTransaction(messageData, senderRoleId) {
    const pool = await pgConnection.getConnection(this.pgConfig);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const msgResult = await client.query(
        `INSERT INTO messages (id, conversation_id, sender_id, message, type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          messageData.id,
          messageData.conversation_id,
          messageData.sender_id,
          messageData.message,
          messageData.type,
        ]
      );

      // Determine which unread counter to increment based on who sent the message
      const unreadQuery =
        senderRoleId === 1
          ? `UPDATE conversations
             SET last_message = $2, last_message_at = NOW(),
                 recruiter_unread = recruiter_unread + 1, updated_at = NOW()
             WHERE id = $1`
          : `UPDATE conversations
             SET last_message = $2, last_message_at = NOW(),
                 worker_unread = worker_unread + 1, updated_at = NOW()
             WHERE id = $1`;

      await client.query(unreadQuery, [messageData.conversation_id, messageData.message]);

      await client.query("COMMIT");
      return wrapper.data(msgResult.rows[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      logger.error(ctx, "insertMessageWithTransaction failed", "command", err);
      return wrapper.error(new InternalServerError("Failed to send message"));
    } finally {
      client.release();
    }
  }

  async markMessagesAsRead(conversation_id, reader_id) {
    try {
      await this.db.executeQuery(
        `UPDATE messages
         SET is_read = TRUE
         WHERE conversation_id = $1 AND sender_id != $2 AND is_read = FALSE`,
        [conversation_id, reader_id]
      );
      return wrapper.data(true);
    } catch (err) {
      logger.error(ctx, "markMessagesAsRead failed", "command", err);
      return wrapper.error(new InternalServerError("Error marking messages as read"));
    }
  }

  async resetUnreadCount(conversation_id, role_id) {
    try {
      const query =
        role_id === 1
          ? `UPDATE conversations SET worker_unread = 0, updated_at = NOW() WHERE id = $1`
          : `UPDATE conversations SET recruiter_unread = 0, updated_at = NOW() WHERE id = $1`;

      await this.db.executeQuery(query, [conversation_id]);
      return wrapper.data(true);
    } catch (err) {
      logger.error(ctx, "resetUnreadCount failed", "command", err);
      return wrapper.error(new InternalServerError("Error resetting unread count"));
    }
  }
}

module.exports = Command;
