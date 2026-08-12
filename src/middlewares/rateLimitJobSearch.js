const rateLimit = require("express-rate-limit");
const { rateLimitedHandler } = require("../helpers/fraud/rate_limit_response");
const { createRateLimitStore } = require("../helpers/fraud/rate_limit_store");
const {
  isBlocked,
  blockIp,
  getTtlSeconds,
  BLOCK_TTL_SECONDS,
} = require("../helpers/fraud/job_search_block");

/** Max 60 job-search requests per minute per IP (anti-scraping). */
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 60;

const checkTemporaryBlock = async (req, res, next) => {
  const ip = req.ip;
  const blocked = await isBlocked(ip);
  if (!blocked) return next();

  const retryAfterSeconds = (await getTtlSeconds(ip)) || BLOCK_TTL_SECONDS;
  res.setHeader("Retry-After", String(retryAfterSeconds));
  return res.status(429).send({
    success: false,
    data: { retry_after_seconds: retryAfterSeconds },
    message:
      "RATE_LIMITED: Too many job search requests. Temporarily blocked. Please try again later.",
    code: 429,
  });
};

const jobSearchLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createRateLimitStore("job_search"),
  keyGenerator: (req) => String(req.ip),
  validate: { keyGeneratorIpFallback: false },
  handler: async (req, res, next, options) => {
    await blockIp(req.ip, BLOCK_TTL_SECONDS);
    return rateLimitedHandler(
      "RATE_LIMITED: Too many job search requests. Please try again later.",
      BLOCK_TTL_SECONDS * 1000
    )(req, res, next, options);
  },
});

module.exports = [checkTemporaryBlock, jobSearchLimiter];
