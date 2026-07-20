const rateLimit = require("express-rate-limit");
const { rateLimitedHandler } = require("../helpers/fraud/rate_limit_response");

const WINDOW_MS = 15 * 60 * 1000;

const verifyEmailResendLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitedHandler(
    "RATE_LIMITED: Too many verification email requests. Please try again later.",
    WINDOW_MS
  ),
});

module.exports = verifyEmailResendLimiter;
