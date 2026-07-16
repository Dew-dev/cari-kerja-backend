const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse, paginationResponse } = require("../../../helpers/utils/response");
const { ForbiddenError } = require("../../../helpers/errors");
const wrapper = require("../../../helpers/utils/wrapper");
const { getIO } = require("../../../helpers/socket");

/**
 * POST /api/v1/chat/start
 * Both workers and recruiters can start a conversation.
 * - Worker (role_id=1): provides recruiter_id in body
 * - Recruiter (role_id=2): provides worker_id in body
 */
const startConversation = async (req, res) => {
  const { role_id, id: userId } = req.userMeta;

  let payload;
  if (role_id === 1) {
    payload = {
      worker_id: userId,
      recruiter_id: req.body.recruiter_id,
      job_id: req.body.job_id || null,
      role_id,
    };
  } else if (role_id === 2) {
    payload = {
      recruiter_id: userId,
      worker_id: req.body.worker_id,
      job_id: req.body.job_id || null,
      role_id,
    };
  } else {
    return sendResponse(
      wrapper.error(new ForbiddenError("Only workers and recruiters can start conversations")),
      res
    );
  }

  const validatePayload = validator.isValidPayload(payload, commandModel.startConversationParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const result = await commandHandler.startConversation(validatePayload.data);
  return sendResponse(result, res, 201);
};

/**
 * GET /api/v1/chat/conversations
 * Returns all conversations for the authenticated user sorted by last_message_at DESC.
 */
const getConversations = async (req, res) => {
  const payload = {
    user_id: req.userMeta.id,
    role_id: req.userMeta.role_id,
  };

  const validatePayload = validator.isValidPayload(payload, queryModel.getConversationsParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const result = await queryHandler.getConversations(validatePayload.data);
  return sendResponse(result, res);
};

/**
 * GET /api/v1/chat/:conversationId/messages
 * Returns paginated messages (oldest first). Supports ?page and ?limit.
 */
const getMessages = async (req, res) => {
  const payload = {
    conversation_id: req.params.conversationId,
    user_id: req.userMeta.id,
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 20,
  };

  const validatePayload = validator.isValidPayload(payload, queryModel.getMessagesParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const result = await queryHandler.getMessages(validatePayload.data);
  return paginationResponse(result, res);
};

/**
 * POST /api/v1/chat/:conversationId/messages
 * Authenticated user sends a message in the conversation.
 */
const sendMessage = async (req, res) => {
  const payload = {
    conversation_id: req.params.conversationId,
    sender_id: req.userMeta.id,
    role_id: req.userMeta.role_id,
    message: req.body.message,
    type: req.body.type || "text",
  };

  const validatePayload = validator.isValidPayload(payload, commandModel.sendMessageParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const result = await commandHandler.sendMessage(validatePayload.data);

  if (!result.err) {
    const io = getIO();
    io?.to(String(validatePayload.data.conversation_id)).emit("receive_message", result.data);
  }

  return sendResponse(result, res, 201);
};

/**
 * PATCH /api/v1/chat/:conversationId/read
 * Mark all unread messages in the conversation as read and reset the unread counter.
 */
const markAsRead = async (req, res) => {
  const payload = {
    conversation_id: req.params.conversationId,
    user_id: req.userMeta.id,
    role_id: req.userMeta.role_id,
  };

  const validatePayload = validator.isValidPayload(payload, commandModel.markAsReadParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const result = await commandHandler.markAsRead(validatePayload.data);

  if (!result.err) {
    const io = getIO();
    io?.to(String(validatePayload.data.conversation_id)).emit("read_message", {
      conversation_id: validatePayload.data.conversation_id,
      reader_id: validatePayload.data.user_id,
    });
  }

  return sendResponse(result, res);
};

module.exports = {
  startConversation,
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
};
