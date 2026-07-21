const rateLimit = require("express-rate-limit");

const cvParseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.userMeta?.id || req.ip),
  validate: { keyGeneratorIpFallback: false },
  message: {
    success: false,
    message: "RATE_LIMITED: Too many CV parse requests. Please try again later.",
    code: 429,
  },
});

module.exports = cvParseLimiter;
