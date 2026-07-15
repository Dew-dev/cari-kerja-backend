const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, InternalServerError } = require("../../../../helpers/errors");

const ctx = "Chat-Query";

class Query {
  constructor(db) {
    this.db = db;
  }

  async getConversationById(id) {
    try {
      const query = `
        SELECT
          c.*,
          wu.username        AS worker_username,
          wr.name            AS worker_name,
          wr.avatar_url      AS worker_avatar,
          ru.username        AS recruiter_username,
          rc.company_name    AS recruiter_company,
          rc.contact_name    AS recruiter_name,
          rc.avatar_url      AS recruiter_avatar
        FROM conversations c
        JOIN users wu ON c.worker_id = wu.id
        LEFT JOIN workers wr ON wr.user_id = wu.id
        JOIN users ru ON c.recruiter_id = ru.id
        LEFT JOIN recruiters rc ON rc.user_id = ru.id
        WHERE c.id = $1
        LIMIT 1
      `;
      const result = await this.db.executeQuery(query, [id]);
      if (!result || result.rows.length === 0) {
        return wrapper.error(new NotFoundError("Conversation not found"));
      }
      return wrapper.data(result.rows[0]);
    } catch (err) {
      logger.error(ctx, "getConversationById failed", "query", err);
      return wrapper.error(new InternalServerError("Error querying conversation"));
    }
  }

  async getConversationByIdForParticipant(id, user_id) {
    try {
      const query = `
        SELECT c.*
        FROM conversations c
        WHERE c.id = $1
          AND (c.worker_id = $2 OR c.recruiter_id = $2)
        LIMIT 1
      `;
      const result = await this.db.executeQuery(query, [id, user_id]);
      if (!result || result.rows.length === 0) {
        return wrapper.error(new NotFoundError("Conversation not found or access denied"));
      }
      return wrapper.data(result.rows[0]);
    } catch (err) {
      logger.error(ctx, "getConversationByIdForParticipant failed", "query", err);
      return wrapper.error(new InternalServerError("Error querying conversation"));
    }
  }

  async getConversationByParticipants(worker_id, recruiter_id, job_id) {
    try {
      let query, values;
      if (job_id) {
        query = `
          SELECT * FROM conversations
          WHERE worker_id = $1 AND recruiter_id = $2 AND job_id = $3
          LIMIT 1
        `;
        values = [worker_id, recruiter_id, job_id];
      } else {
        query = `
          SELECT * FROM conversations
          WHERE worker_id = $1 AND recruiter_id = $2 AND job_id IS NULL
          LIMIT 1
        `;
        values = [worker_id, recruiter_id];
      }
      const result = await this.db.executeQuery(query, values);
      if (!result || result.rows.length === 0) {
        return wrapper.data(null);
      }
      return wrapper.data(result.rows[0]);
    } catch (err) {
      logger.error(ctx, "getConversationByParticipants failed", "query", err);
      return wrapper.error(new InternalServerError("Error querying conversation"));
    }
  }

  async getConversationsByUserId(user_id, role_id) {
    try {
      const query = `
        SELECT
          c.*,
          wu.username        AS worker_username,
          wr.name            AS worker_name,
          wr.avatar_url      AS worker_avatar,
          ru.username        AS recruiter_username,
          rc.company_name    AS recruiter_company,
          rc.contact_name    AS recruiter_name,
          rc.avatar_url      AS recruiter_avatar,
          CASE
            WHEN c.worker_id = $1 THEN c.worker_unread
            ELSE c.recruiter_unread
          END AS unread_count
        FROM conversations c
        JOIN users wu ON c.worker_id = wu.id
        LEFT JOIN workers wr ON wr.user_id = wu.id
        JOIN users ru ON c.recruiter_id = ru.id
        LEFT JOIN recruiters rc ON rc.user_id = ru.id
        WHERE ($2 = 1 AND c.worker_id = $1)
           OR ($2 = 2 AND c.recruiter_id = $1)
        ORDER BY c.last_message_at DESC NULLS LAST
      `;
      const result = await this.db.executeQuery(query, [user_id, role_id]);
      if (!result) {
        return wrapper.error(new InternalServerError("Failed to fetch conversations"));
      }
      return wrapper.data(result.rows);
    } catch (err) {
      logger.error(ctx, "getConversationsByUserId failed", "query", err);
      return wrapper.error(new InternalServerError("Error querying conversations"));
    }
  }

  async getMessagesByConversationId(conversation_id, limit, offset) {
    try {
      const query = `
        SELECT
          m.*,
          u.username AS sender_username
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at ASC
        LIMIT $2 OFFSET $3
      `;
      const countQuery = `
        SELECT COUNT(*) AS total
        FROM messages
        WHERE conversation_id = $1
      `;
      const [result, countResult] = await Promise.all([
        this.db.executeQuery(query, [conversation_id, limit, offset]),
        this.db.executeQuery(countQuery, [conversation_id]),
      ]);
      if (!result) {
        return wrapper.error(new InternalServerError("Failed to fetch messages"));
      }
      const total = parseInt(countResult?.rows[0]?.total || 0, 10);
      return wrapper.paginationData(result.rows, { total, limit, offset });
    } catch (err) {
      logger.error(ctx, "getMessagesByConversationId failed", "query", err);
      return wrapper.error(new InternalServerError("Error querying messages"));
    }
  }
}

module.exports = Query;
