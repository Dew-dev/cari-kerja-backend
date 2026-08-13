const Channel = require("./Channel");
const { addEmailJob } = require("../../queues/email.queue");

class EmailChannel extends Channel {
  get name() {
    return "email";
  }

  canDeliver(user) {
    const email = user?.email;
    if (!email || !String(email).trim()) return false;
    // Prefer local/google; allow any provider that has a real email.
    return true;
  }

  async send({ user, type, data, rendered }) {
    if (!rendered?.email) {
      return { skipped: true, reason: "no_email_render" };
    }
    const { to, subject, html, recipient_id } = rendered.email;
    const destination = to || user.email;
    if (!destination) {
      return { skipped: true, reason: "no_email" };
    }
    await addEmailJob({
      to: destination,
      subject,
      html,
      recipient_id,
      userId: user.id || user.user_id || null,
      notificationType: type,
    });
    return { queued: true, channel: this.name };
  }
}

module.exports = EmailChannel;
