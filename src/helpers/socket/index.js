const { Server } = require("socket.io");
const config = require("../../config/global_config");
const { getToken, verifyAccessToken } = require("../auth/jwt_helper");
const { assertUserNotSuspendedById } = require("../auth/account_guards");
const { readMaintenanceFlag } = require("../../middlewares/maintenanceMode");
const chatHandler = require("./chat_handler");
const logger = require("../utils/logger");

const ctx = "Socket-Server";

/** @type {import("socket.io").Server | null} */
let ioInstance = null;

/**
 * Attach a Socket.IO server to the given HTTP server instance.
 * @param {import("http").Server} httpServer
 * @returns {import("socket.io").Server}
 */
const initSocket = (httpServer) => {
  const allowedOrigins = String(config.get("/cors/origins") || "*")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const io = new Server(httpServer, {
    cors: {
      // credentials + "*" is invalid in browsers; reflect origin in dev instead
      origin:
        process.env.NODE_ENV !== "production"
          ? true
          : allowedOrigins.includes("*")
            ? true
            : allowedOrigins,
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  ioInstance = io;

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

      const roleId = Number(verified.data?.role_id);
      const isAdmin = roleId === 3 || roleId === 4;
      if (!isAdmin) {
        const maintenance = await readMaintenanceFlag();
        if (maintenance) {
          return next(
            new Error("MAINTENANCE_MODE: Platform is under maintenance. Please try again later.")
          );
        }
      }

      const suspension = await assertUserNotSuspendedById(verified.data?.id);
      if (suspension.err) {
        return next(new Error("Forbidden: ACCOUNT_RESTRICTED: account is suspended"));
      }

      if (suspension.data?.restricted_verification) {
        return next(
          new Error(
            "Forbidden: ACCOUNT_RESTRICTED: VERIFICATION_REQUIRED: Complete company verification before using chat"
          )
        );
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

/** @returns {import("socket.io").Server | null} */
const getIO = () => ioInstance;

module.exports = { initSocket, getIO };
