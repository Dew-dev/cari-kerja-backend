const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "RATE_LIMITED: Too many login attempts. Please try again later.",
    code: 429,
  },
});

module.exports = loginLimiter;
