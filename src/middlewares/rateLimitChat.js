const rateLimit = require("express-rate-limit");

/** Horizontal burst guard for chat message sends (REST). */
const chatMessageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 90,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.userMeta?.id || req.ip),
  validate: { keyGeneratorIpFallback: false },
  message: {
    success: false,
    message: "RATE_LIMITED: Too many chat messages. Please try again later.",
    code: 429,
  },
});

module.exports = chatMessageLimiter;
