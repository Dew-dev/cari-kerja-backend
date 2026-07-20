const CommonError = require("./common_error");

class TooManyRequestsError extends CommonError {
  constructor(message, meta = {}) {
    super(message);
    this.name = "TooManyRequestsError";
    this.statusCode = 429;
    this.retry_after_seconds =
      meta.retry_after_seconds != null ? Number(meta.retry_after_seconds) : 3600;
  }
}

module.exports = TooManyRequestsError;
