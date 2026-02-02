const CommonError = require("./common_error");

class TooManyRequestsError extends CommonError {
  constructor(message) {
    super(message);
    this.name = "TooManyRequestsError";
    this.statusCode = 429;
  }
}

module.exports = TooManyRequestsError;
