const Channel = require("./Channel");

/** Future-ready stub — not wired until WhatsApp provider exists. */
class WhatsAppChannel extends Channel {
  get name() {
    return "whatsapp";
  }

  canDeliver() {
    return false;
  }

  async send() {
    return { skipped: true, reason: "whatsapp_not_implemented" };
  }
}

module.exports = WhatsAppChannel;
