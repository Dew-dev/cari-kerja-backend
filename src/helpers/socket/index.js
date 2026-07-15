const { Server } = require("socket.io");
const config = require("../../config/global_config");
const { getToken, verifyAccessToken } = require("../auth/jwt_helper");
const chatHandler = require("./chat_handler");
const logger = require("../utils/logger");

const ctx = "Socket-Server";

/**
 * Attach a Socket.IO server to the given HTTP server instance.
 * @param {import("http").Server} httpServer
 * @returns {import("socket.io").Server}
 */
const initSocket = (httpServer) => {
  const allowedOrigins = String(config.get("/cors/origins") || "*").split(",");

  const io = new Server(httpServer, {
    cors: {
      origin:
        process.env.NODE_ENV !== "production"
          ? "*"
          : allowedOrigins,
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  // ─── JWT Authentication Middleware ───────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      // Accept token from handshake auth object or Authorization header
      const rawToken =
        socket.handshake.auth?.token ||
        getToken(socket.handshake.headers?.authorization) ||
        null;

      if (!rawToken) {
        return next(new Error("Unauthorized: no token provided"));
      }

      const verified = await verifyAccessToken(rawToken);
      if (verified.err) {
        return next(new Error("Unauthorized: invalid or expired token"));
      }

      socket.userMeta = verified.data;
      return next();
    } catch (err) {
      logger.error(ctx, "socket auth middleware error", "io.use", err);
      return next(new Error("Unauthorized"));
    }
  });

  // ─── Connection Handler ───────────────────────────────────────────────────
  io.on("connection", (socket) => {
    logger.info(ctx, "new connection", "io.connection", { userId: socket.userMeta?.id });
    chatHandler(io, socket);
  });

  return io;
};

module.exports = { initSocket };
