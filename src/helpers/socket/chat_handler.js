const commandHandler = require("../../modules/chat/repositories/commands/command_handler");
const queryHandler = require("../../modules/chat/repositories/queries/query_handler");
const logger = require("../utils/logger");

const ctx = "Chat-Socket-Handler";

/**
 * Registers all chat-related Socket.IO events for a connected socket.
 * @param {import("socket.io").Server} io
 * @param {import("socket.io").Socket} socket
 */
module.exports = (io, socket) => {
  const { id: userId, role_id } = socket.userMeta;

  logger.info(ctx, "user connected", "chatHandler", { userId, role_id });

  // ─── join_conversation ────────────────────────────────────────────────────
  // Client joins the Socket.IO room for a conversation.
  // Only verified participants are allowed in.
  socket.on("join_conversation", async ({ conversation_id }) => {
    if (!conversation_id) {
      return socket.emit("error", { message: "conversation_id is required" });
    }

    const result = await queryHandler.getConversationById({ conversation_id, user_id: userId });
    if (result.err) {
      return socket.emit("error", { message: "Conversation not found or access denied" });
    }

    socket.join(conversation_id);
    socket.emit("joined", { conversation_id });
    logger.info(ctx, "join_conversation", "user joined room", { userId, conversation_id });
  });

  // ─── leave_conversation ───────────────────────────────────────────────────
  socket.on("leave_conversation", ({ conversation_id }) => {
    socket.leave(conversation_id);
    logger.info(ctx, "leave_conversation", "user left room", { userId, conversation_id });
  });

  // ─── send_message ─────────────────────────────────────────────────────────
  // Validate ownership → save message → update conversation → broadcast
  socket.on("send_message", async ({ conversation_id, message, type = "text" }) => {
    if (!conversation_id || !message) {
      return socket.emit("error", { message: "conversation_id and message are required" });
    }

    const result = await commandHandler.sendMessage({
      conversation_id,
      sender_id: userId,
      role_id,
      message,
      type,
    });

    if (result.err) {
      logger.error(ctx, "send_message failed", "chatHandler", result.err);
      return socket.emit("error", { message: result.err.message || "Failed to send message" });
    }

    // Broadcast the new message to all clients in the conversation room
    io.to(conversation_id).emit("receive_message", result.data);
    logger.info(ctx, "send_message", "message broadcasted", {
      userId,
      conversation_id,
      messageId: result.data?.id,
    });
  });

  // ─── typing ───────────────────────────────────────────────────────────────
  // Typing events are never stored; just forwarded to other room members.
  socket.on("typing", ({ conversation_id }) => {
    socket.to(conversation_id).emit("typing", { user_id: userId, conversation_id });
  });

  // ─── stop_typing ──────────────────────────────────────────────────────────
  socket.on("stop_typing", ({ conversation_id }) => {
    socket.to(conversation_id).emit("stop_typing", { user_id: userId, conversation_id });
  });

  // ─── read_message ─────────────────────────────────────────────────────────
  // Mark all unread messages as read and notify the other participant.
  socket.on("read_message", async ({ conversation_id }) => {
    if (!conversation_id) {
      return socket.emit("error", { message: "conversation_id is required" });
    }

    const result = await commandHandler.markAsRead({
      conversation_id,
      user_id: userId,
      role_id,
    });

    if (result.err) {
      return socket.emit("error", { message: result.err.message || "Failed to mark as read" });
    }

    // Notify the other participant that messages have been read
    socket.to(conversation_id).emit("read_message", {
      conversation_id,
      reader_id: userId,
    });

    logger.info(ctx, "read_message", "messages marked as read", { userId, conversation_id });
  });

  // ─── disconnect ───────────────────────────────────────────────────────────
  socket.on("disconnect", (reason) => {
    logger.info(ctx, "user disconnected", "chatHandler", { userId, reason });
  });
};
