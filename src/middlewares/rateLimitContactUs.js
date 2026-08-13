const rateLimit = require("express-rate-limit");
const { rateLimitedHandler } = require("../helpers/fraud/rate_limit_response");
const { createRateLimitStore } = require("../helpers/fraud/rate_limit_store");

const WINDOW_MS = 15 * 60 * 1000;

const contactUsLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createRateLimitStore("contact"),
  handler: rateLimitedHandler(
    "RATE_LIMITED: Too many contact requests. Please try again later.",
    WINDOW_MS
  ),
});

module.exports = contactUsLimiter;
