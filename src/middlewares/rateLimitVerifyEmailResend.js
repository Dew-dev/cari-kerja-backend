const rateLimit = require("express-rate-limit");

const verifyEmailResendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "RATE_LIMITED: Too many verification email requests. Please try again later.",
    code: 429,
  },
});

module.exports = verifyEmailResendLimiter;
