const { v4: uuidv4 } = require("uuid");
const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const {
  ForbiddenError,
  BadRequestError,
  NotFoundError,
  ConflictError,
} = require("../../../../helpers/errors");
const { formatConversation, formatMessage } = require("../../helpers/format");
const { assertChatVelocity } = require("../../../../helpers/fraud/velocity");
const {
  assertUsersNotBlocked,
  assertWorkerCanStartChat,
} = require("../../../../helpers/fraud/chat_guards");
const { upsertOpenFraudEvent } = require("../../../../helpers/fraud/fraud_events");

const ctx = "Chat-Command-Domain";

class ChatCommandDomain {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async startConversation(payload) {
    const { job_id, role_id } = payload;

    // FE often sends workers.id / recruiters.id (profile), but conversations FK users(id).
    const workerResolved = await this.query.resolveWorkerUserId(payload.worker_id);
    if (workerResolved.err) {
      return wrapper.error(new BadRequestError("Invalid worker_id: worker user not found"));
    }
    const recruiterResolved = await this.query.resolveRecruiterUserId(payload.recruiter_id);
    if (recruiterResolved.err) {
      return wrapper.error(new BadRequestError("Invalid recruiter_id: recruiter user not found"));
    }

    const worker_id = workerResolved.data;
    const recruiter_id = recruiterResolved.data;
    const viewerUserId = role_id === 1 ? worker_id : recruiter_id;

    if (worker_id === recruiter_id) {
      return wrapper.error(new BadRequestError("Worker and recruiter cannot be the same user"));
    }

    const blocked = await assertUsersNotBlocked(this.command.db, worker_id, recruiter_id);
    if (blocked.err) {
      return blocked;
    }

    // Check if a conversation already exists between these participants
    // (same pair reuses one thread even if job_id differs)
    const existing = await this.query.getConversationByParticipants(
      worker_id,
      recruiter_id,
      job_id || null
    );
    if (existing.err) {
      return wrapper.error(existing.err);
    }

    let conversationId = existing.data?.id;
    if (!conversationId) {
      // New thread gating: recruiters may initiate; workers only after applying.
      if (Number(role_id) === 1) {
        const gate = await assertWorkerCanStartChat(
          this.command.db,
          worker_id,
          recruiter_id
        );
        if (gate.err) {
          return gate;
        }
      }

      conversationId = uuidv4();
      const created = await this.command.createConversation({
        id: conversationId,
        worker_id,
        recruiter_id,
        job_id: job_id || null,
      });
      if (created.err) {
        // Race: another request may have created the same pair concurrently
        const raced = await this.query.getConversationByParticipants(
          worker_id,
          recruiter_id,
          job_id || null
        );
        if (!raced.err && raced.data?.id) {
          conversationId = raced.data.id;
          logger.info(ctx, "startConversation", "conversation created by concurrent request", {
            id: conversationId,
            worker_id,
            recruiter_id,
          });
        } else {
          logger.error(ctx, "startConversation - create failed", "domain", created.err);
          return wrapper.error(created.err);
        }
      } else {
        logger.info(ctx, "startConversation", "conversation created", {
          id: conversationId,
          worker_id,
          recruiter_id,
          job_id: job_id || null,
        });
      }
    } else {
      logger.info(ctx, "startConversation", "conversation already exists", {
        id: conversationId,
        worker_id,
        recruiter_id,
        job_id: existing.data.job_id || null,
        requested_job_id: job_id || null,
      });
    }

    const full = await this.query.getConversationByIdForParticipant(conversationId, viewerUserId);
    if (full.err) {
      return wrapper.error(full.err);
    }

    return wrapper.data(formatConversation(full.data, viewerUserId));
  }

  async sendMessage(payload) {
    const { conversation_id, sender_id, role_id, message, type } = payload;

    // Verify the sender is a participant in this conversation
    const conv = await this.query.getConversationByIdForParticipant(conversation_id, sender_id);
    if (conv.err) {
      logger.error(ctx, "sendMessage - access denied", "domain", conv.err);
      return wrapper.error(new ForbiddenError("Conversation not found or access denied"));
    }

    if (String(conv.data.status || "").toUpperCase() === "ARCHIVED") {
      return wrapper.error(
        new ForbiddenError("CHAT_ARCHIVED: Cannot send messages in an archived conversation")
      );
    }

    const otherUserId =
      conv.data.worker_id === sender_id
        ? conv.data.recruiter_id
        : conv.data.worker_id;
    const blocked = await assertUsersNotBlocked(this.command.db, sender_id, otherUserId);
    if (blocked.err) {
      return blocked;
    }

    const velocity = await assertChatVelocity(this.command.db, sender_id);
    if (velocity.err) {
      return velocity;
    }

    const messageId = uuidv4();
    const result = await this.command.insertMessageWithTransaction(
      {
        id: messageId,
        conversation_id,
        sender_id,
        message,
        type: type || "text",
      },
      role_id
    );

    if (result.err) {
      logger.error(ctx, "sendMessage - insert failed", "domain", result.err);
      return wrapper.error(result.err);
    }

    const enriched = await this.query.getMessageById(messageId);
    if (enriched.err) {
      // Fallback to raw insert row if enrich query somehow fails
      logger.error(ctx, "sendMessage - enrich failed", "domain", enriched.err);
      return wrapper.data(
        formatMessage({
          ...result.data,
          sender_username: null,
          sender_name: null,
          sender_avatar: null,
        })
      );
    }

    logger.info(ctx, "sendMessage", "message sent", { messageId, conversation_id, sender_id });
    return wrapper.data(formatMessage(enriched.data));
  }

  async markAsRead(payload) {
    const { conversation_id, user_id, role_id } = payload;

    // Verify the user is a participant
    const conv = await this.query.getConversationByIdForParticipant(conversation_id, user_id);
    if (conv.err) {
      return wrapper.error(new ForbiddenError("Conversation not found or access denied"));
    }

    // Mark all messages sent by the other party as read
    const markResult = await this.command.markMessagesAsRead(conversation_id, user_id);
    if (markResult.err) {
      return wrapper.error(markResult.err);
    }

    // Reset the caller's unread counter
    const resetResult = await this.command.resetUnreadCount(conversation_id, role_id);
    if (resetResult.err) {
      return wrapper.error(resetResult.err);
    }

    logger.info(ctx, "markAsRead", "messages marked as read", { conversation_id, user_id });
    return wrapper.data({ success: true, conversation_id });
  }

  async blockUser(payload) {
    const { blocker_user_id, blocked_user_id } = payload;
    if (blocker_user_id === blocked_user_id) {
      return wrapper.error(new BadRequestError("Cannot block yourself"));
    }

    const userCheck = await this.command.db.executeQuery(
      `SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [blocked_user_id]
    );
    if (!userCheck?.rows?.length) {
      return wrapper.error(new NotFoundError("User to block not found"));
    }

    try {
      const result = await this.command.db.executeQuery(
        `
        INSERT INTO chat_blocks (id, blocker_user_id, blocked_user_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (blocker_user_id, blocked_user_id) DO NOTHING
        RETURNING *
        `,
        [uuidv4(), blocker_user_id, blocked_user_id]
      );
      if (result?.rows?.length) {
        return wrapper.data(result.rows[0]);
      }
      const existing = await this.command.db.executeQuery(
        `SELECT * FROM chat_blocks WHERE blocker_user_id = $1 AND blocked_user_id = $2 LIMIT 1`,
        [blocker_user_id, blocked_user_id]
      );
      return wrapper.data(existing.rows[0]);
    } catch (err) {
      logger.error(ctx, "blockUser", "failed", err);
      return wrapper.error(new ConflictError("Failed to block user"));
    }
  }

  async unblockUser(payload) {
    const { blocker_user_id, blocked_user_id } = payload;
    const result = await this.command.db.executeQuery(
      `
      DELETE FROM chat_blocks
      WHERE blocker_user_id = $1 AND blocked_user_id = $2
      RETURNING id
      `,
      [blocker_user_id, blocked_user_id]
    );
    if (!result?.rows?.length) {
      return wrapper.error(new NotFoundError("Block not found"));
    }
    return wrapper.data({ success: true, blocked_user_id });
  }

  async listBlocks(payload) {
    const { user_id } = payload;
    const result = await this.command.db.executeQuery(
      `
      SELECT id, blocker_user_id, blocked_user_id, created_at
      FROM chat_blocks
      WHERE blocker_user_id = $1
      ORDER BY created_at DESC
      `,
      [user_id]
    );
    return wrapper.data(result?.rows || []);
  }

  async reportConversation(payload) {
    const { conversation_id, reporter_user_id, message_id, reason } = payload;

    const conv = await this.query.getConversationByIdForParticipant(
      conversation_id,
      reporter_user_id
    );
    if (conv.err || !conv.data) {
      return wrapper.error(
        new ForbiddenError("Conversation not found or access denied")
      );
    }

    const reported_user_id =
      conv.data.worker_id === reporter_user_id
        ? conv.data.recruiter_id
        : conv.data.worker_id;

    if (message_id) {
      const msg = await this.command.db.executeQuery(
        `
        SELECT id, sender_id FROM messages
        WHERE id = $1 AND conversation_id = $2
        LIMIT 1
        `,
        [message_id, conversation_id]
      );
      if (!msg?.rows?.length) {
        return wrapper.error(new NotFoundError("Message not found in this conversation"));
      }
      if (msg.rows[0].sender_id === reporter_user_id) {
        return wrapper.error(new BadRequestError("Cannot report your own message"));
      }
    }

    const reportId = uuidv4();
    const insert = await this.command.db.executeQuery(
      `
      INSERT INTO chat_reports (
        id, reporter_user_id, reported_user_id, conversation_id, message_id, reason, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'open')
      RETURNING *
      `,
      [
        reportId,
        reporter_user_id,
        reported_user_id,
        conversation_id,
        message_id || null,
        reason,
      ]
    );

    if (!insert?.rows?.length) {
      return wrapper.error(new ConflictError("Failed to create chat report"));
    }

    const entityType = message_id ? "chat_message" : "user";
    const entityId = message_id || reported_user_id;
    await upsertOpenFraudEvent(this.command.db, {
      entity_type: entityType,
      entity_id: entityId,
      source: "chat_report",
      risk_score: 50,
      flags: [{ code: "USER_REPORT", detail: reason, weight: 50 }],
      summary: `Chat report: ${reason}`.slice(0, 500),
      metadata: {
        chat_report_id: reportId,
        conversation_id,
        message_id: message_id || null,
        reporter_user_id,
        reported_user_id,
      },
    });

    logger.info(ctx, "reportConversation", "report created", {
      reportId,
      conversation_id,
      reporter_user_id,
    });

    return wrapper.data(insert.rows[0]);
  }
}

module.exports = ChatCommandDomain;
