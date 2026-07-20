const { v4: uuidv4 } = require("uuid");
const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const {
  ForbiddenError,
  BadRequestError,
} = require("../../../../helpers/errors");
const { formatConversation, formatMessage } = require("../../helpers/format");

const ctx = "Chat-Command-Domain";

class ChatCommandDomain {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async startConversation(payload) {
    const { job_id } = payload;

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
    const viewerUserId = payload.role_id === 1 ? worker_id : recruiter_id;

    if (worker_id === recruiter_id) {
      return wrapper.error(new BadRequestError("Worker and recruiter cannot be the same user"));
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
      return wrapper.data(formatMessage({ ...result.data, sender_username: null, sender_name: null, sender_avatar: null }));
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
}

module.exports = ChatCommandDomain;
