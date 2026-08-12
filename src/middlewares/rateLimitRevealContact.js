const rateLimit = require("express-rate-limit");
const { rateLimitedHandler } = require("../helpers/fraud/rate_limit_response");
const { createRateLimitStore } = require("../helpers/fraud/rate_limit_store");

/** Limit mass scraping via click-to-reveal contact API. */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 20;

const revealContactLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createRateLimitStore("reveal_contact"),
  keyGenerator: (req) => String(req.userMeta?.id || req.ip),
  validate: { keyGeneratorIpFallback: false },
  handler: rateLimitedHandler(
    "RATE_LIMITED: Too many contact reveal requests. Please try again later.",
    WINDOW_MS
  ),
});

module.exports = revealContactLimiter;
