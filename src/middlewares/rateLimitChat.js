const rateLimit = require("express-rate-limit");
const { rateLimitedHandler } = require("../helpers/fraud/rate_limit_response");
const { createRateLimitStore } = require("../helpers/fraud/rate_limit_store");

const WINDOW_MS = 15 * 60 * 1000;

const chatMessageLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 90,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createRateLimitStore("chat"),
  keyGenerator: (req) => String(req.userMeta?.id || req.ip),
  validate: { keyGeneratorIpFallback: false },
  handler: rateLimitedHandler(
    "RATE_LIMITED: Too many chat messages. Please try again later.",
    WINDOW_MS
  ),
});

module.exports = chatMessageLimiter;
