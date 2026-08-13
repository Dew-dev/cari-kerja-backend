const rateLimit = require("express-rate-limit");
const { rateLimitedHandler } = require("../helpers/fraud/rate_limit_response");
const { createRateLimitStore } = require("../helpers/fraud/rate_limit_store");

const WINDOW_MS = 15 * 60 * 1000;

const loginLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createRateLimitStore("login"),
  handler: rateLimitedHandler(
    "RATE_LIMITED: Too many login attempts. Please try again later.",
    WINDOW_MS
  ),
});

module.exports = loginLimiter;
