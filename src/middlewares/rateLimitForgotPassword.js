const rateLimit = require("express-rate-limit");
const { rateLimitedHandler } = require("../helpers/fraud/rate_limit_response");
const { createRateLimitStore } = require("../helpers/fraud/rate_limit_store");

const WINDOW_MS = 15 * 60 * 1000;

const forgotPasswordLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createRateLimitStore("forgot-password"),
  handler: rateLimitedHandler(
    "RATE_LIMITED: Too many password reset requests. Please try again later.",
    WINDOW_MS
  ),
});

module.exports = forgotPasswordLimiter;
