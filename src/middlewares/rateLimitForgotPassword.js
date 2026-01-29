const rateLimit = require("express-rate-limit");

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10, // 10 request per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password reset requests. Please try again later.",
  },
});

module.exports = forgotPasswordLimiter;
