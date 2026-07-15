const verifyToken = require("../middlewares/verifyToken");
const chatHandler = require("../modules/chat/handlers/api_handler");

module.exports = (server) => {
  // Start or retrieve an existing conversation
  server.post("/api/v1/chat/start", verifyToken, chatHandler.startConversation);

  // List all conversations for the authenticated user
  server.get("/api/v1/chat/conversations", verifyToken, chatHandler.getConversations);

  // Get paginated messages for a conversation
  server.get("/api/v1/chat/:conversationId/messages", verifyToken, chatHandler.getMessages);

  // Send a message in a conversation
  server.post("/api/v1/chat/:conversationId/messages", verifyToken, chatHandler.sendMessage);

  // Mark all messages in a conversation as read
  server.patch("/api/v1/chat/:conversationId/read", verifyToken, chatHandler.markAsRead);
};
