const CommonError = require("./common_error");

class ServiceUnavailableError extends CommonError {
  constructor(message) {
    super(message);
    this.name = "ServiceUnavailableError";
    this.statusCode = 503;
  }
}

module.exports = ServiceUnavailableError;
