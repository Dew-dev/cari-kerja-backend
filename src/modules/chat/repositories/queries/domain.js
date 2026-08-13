const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { ForbiddenError } = require("../../../../helpers/errors");
const { formatConversation, formatMessage } = require("../../helpers/format");

const ctx = "Chat-Query-Domain";

class ChatQueryDomain {
  constructor(db) {
    this.query = new Query(db);
  }

  async getConversations(payload) {
    const { user_id, role_id } = payload;
    const result = await this.query.getConversationsByUserId(user_id, role_id);
    if (result.err) {
      logger.error(ctx, "getConversations failed", "domain", result.err);
      return wrapper.error(result.err);
    }
    logger.info(ctx, "getConversations", "fetched conversations", { user_id });
    return wrapper.data(
      (result.data || []).map((row) => formatConversation(row, user_id))
    );
  }

  async getConversationById(payload) {
    const { conversation_id, user_id } = payload;
    const result = await this.query.getConversationByIdForParticipant(conversation_id, user_id);
    if (result.err) {
      logger.error(ctx, "getConversationById failed", "domain", result.err);
      return wrapper.error(result.err);
    }
    return wrapper.data(formatConversation(result.data, user_id));
  }

  async getMessages(payload) {
    const { conversation_id, user_id, page, limit } = payload;

    // Verify the user is a participant
    const conv = await this.query.getConversationByIdForParticipant(conversation_id, user_id);
    if (conv.err) {
      logger.error(ctx, "getMessages - conversation access denied", "domain", conv.err);
      return wrapper.error(new ForbiddenError("Conversation not found or access denied"));
    }

    const offset = (page - 1) * limit;
    const result = await this.query.getMessagesByConversationId(conversation_id, limit, offset);
    if (result.err) {
      logger.error(ctx, "getMessages failed", "domain", result.err);
      return wrapper.error(result.err);
    }

    logger.info(ctx, "getMessages", "fetched messages", { conversation_id, page, limit });
    return wrapper.paginationData(
      (result.data || []).map(formatMessage),
      {
        ...result.meta,
        page,
        total_pages: Math.ceil(result.meta.total / limit),
      }
    );
  }
}

module.exports = ChatQueryDomain;
