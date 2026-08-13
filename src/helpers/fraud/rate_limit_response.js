/**
 * Shared 429 body for express-rate-limit middlewares.
 * Includes retry_after_seconds for FE cooldown UX.
 */
const rateLimitedHandler =
  (message, windowMs = 15 * 60 * 1000) =>
  (req, res, _next, options) => {
    const retryAfterSeconds = Math.ceil(
      Number(options?.windowMs || windowMs) / 1000
    );
    res.setHeader("Retry-After", String(retryAfterSeconds));
    return res.status(options?.statusCode || 429).send({
      success: false,
      data: { retry_after_seconds: retryAfterSeconds },
      message,
      code: 429,
    });
  };

module.exports = { rateLimitedHandler };
