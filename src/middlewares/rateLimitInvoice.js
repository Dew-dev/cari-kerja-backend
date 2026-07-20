const rateLimit = require("express-rate-limit");

/** Horizontal burst guard for invoice creation. */
const invoiceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.userMeta?.id || req.ip),
  validate: { keyGeneratorIpFallback: false },
  message: {
    success: false,
    message: "RATE_LIMITED: Too many invoice requests. Please try again later.",
    code: 429,
  },
});

module.exports = invoiceLimiter;
