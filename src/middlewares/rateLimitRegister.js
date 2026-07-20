const rateLimit = require("express-rate-limit");
const { rateLimitedHandler } = require("../helpers/fraud/rate_limit_response");

const WINDOW_MS = 15 * 60 * 1000;

const registerLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitedHandler(
    "RATE_LIMITED: Too many registration attempts. Please try again later.",
    WINDOW_MS
  ),
});

module.exports = registerLimiter;
