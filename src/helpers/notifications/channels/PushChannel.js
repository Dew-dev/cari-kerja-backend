const Channel = require("./Channel");

/** Future-ready stub — not wired until push provider exists. */
class PushChannel extends Channel {
  get name() {
    return "push";
  }

  canDeliver() {
    return false;
  }

  async send() {
    return { skipped: true, reason: "push_not_implemented" };
  }
}

module.exports = PushChannel;
