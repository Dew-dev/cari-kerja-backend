const Channel = require("./Channel");

/** Future-ready stub — not wired until SMS provider exists. */
class SmsChannel extends Channel {
  get name() {
    return "sms";
  }

  canDeliver() {
    return false;
  }

  async send() {
    return { skipped: true, reason: "sms_not_implemented" };
  }
}

module.exports = SmsChannel;
