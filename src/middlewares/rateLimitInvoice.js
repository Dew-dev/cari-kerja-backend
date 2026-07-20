const rateLimit = require("express-rate-limit");
const { rateLimitedHandler } = require("../helpers/fraud/rate_limit_response");

const WINDOW_MS = 15 * 60 * 1000;

/** Horizontal burst guard for invoice creation. */
const invoiceLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.userMeta?.id || req.ip),
  validate: { keyGeneratorIpFallback: false },
  handler: rateLimitedHandler(
    "RATE_LIMITED: Too many invoice requests. Please try again later.",
    WINDOW_MS
  ),
});

module.exports = invoiceLimiter;
