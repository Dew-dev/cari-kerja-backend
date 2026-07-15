const { v4: uuidv4 } = require("uuid");
const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  InternalServerError,
} = require("../../../../helpers/errors");

const ctx = "Chat-Command-Domain";

class ChatCommandDomain {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async startConversation(payload) {
    const { worker_id, recruiter_id, job_id, role_id } = payload;

    // Validate that worker and recruiter are not the same user
    if (worker_id === recruiter_id) {
      return wrapper.error(new BadRequestError("Worker and recruiter cannot be the same user"));
    }

    // Check if a conversation already exists between these participants
    const existing = await this.query.getConversationByParticipants(
      worker_id,
      recruiter_id,
      job_id || null
    );
    if (existing.err) {
      return wrapper.error(existing.err);
    }
    if (existing.data) {
      logger.info(ctx, "startConversation", "conversation already exists", { worker_id, recruiter_id });
      return wrapper.data(existing.data);
    }

    // Create new conversation
    const id = uuidv4();
    const created = await this.command.createConversation({
      id,
      worker_id,
      recruiter_id,
      job_id: job_id || null,
    });
    if (created.err) {
      logger.error(ctx, "startConversation - create failed", "domain", created.err);
      return wrapper.error(created.err);
    }

    logger.info(ctx, "startConversation", "conversation created", { id, worker_id, recruiter_id });
    return wrapper.data(created.data);
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

    logger.info(ctx, "sendMessage", "message sent", { messageId, conversation_id, sender_id });
    return wrapper.data(result.data);
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
