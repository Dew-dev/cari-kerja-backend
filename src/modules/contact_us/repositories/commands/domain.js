const Command = require("./command");
const Query = require("../queries/query");
const { v4: uuidv4 } = require("uuid");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const {
  InternalServerError,
  BadRequestError,
  NotFoundError,
} = require("../../../../helpers/errors");
const { addEmailJob } = require("../../../../helpers/queues/email.queue");
const ctx = "ContactUs-Command-Domain";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

class ContactUsDomain {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async createContactMessage(payload) {
    const { name, email, subject, message, phone } = payload;

    if (!name || !email || !subject || !message) {
      return wrapper.error(
        new BadRequestError("name, email, subject, dan message wajib diisi")
      );
    }

    const newPayload = {
      id: uuidv4(),
      name,
      email,
      subject,
      message,
      phone: phone || null,
      created_at: new Date(),
    };

    const result = await this.command.insertOne(newPayload);
    if (result.err) {
      logger.error(
        ctx,
        "createContactMessage",
        "Failed insert contact message",
        result.err
      );
      return wrapper.error(
        new InternalServerError("Failed insert contact message")
      );
    }

    try {
      const safeName = escapeHtml(name);
      const safeEmail = escapeHtml(email);
      const safePhone = escapeHtml(phone || "Not provided");
      const safeSubject = escapeHtml(subject);
      const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

      const emailHtml = `
        <h2>New Contact Us Message</h2>
        <p><strong>From:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Phone:</strong> ${safePhone}</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${safeMessage}</p>
      `;

      await addEmailJob({
        to: process.env.MAIL_USER,
        subject: `[Contact Us] ${subject}`,
        html: emailHtml,
      });
    } catch (err) {
      logger.error(ctx, "sendMail", "Error sending email", err);
    }

    return wrapper.data(result.data);
  }

  async deleteContactMessage(payload) {
    const { id } = payload;

    if (!id) {
      return wrapper.error(new BadRequestError("id wajib diisi"));
    }

    const existing = await this.query.findOne(
      { id },
      { id: 1, name: 1, email: 1 }
    );
    if (existing.err || !existing.data) {
      return wrapper.error(new NotFoundError("Contact message not found"));
    }

    const result = await this.command.deleteOne({ id });
    if (result.err) {
      logger.error(
        ctx,
        "deleteContactMessage",
        "Failed delete contact message",
        result.err
      );
      return wrapper.error(
        new InternalServerError("Failed delete contact message")
      );
    }

    return wrapper.data(result.data);
  }
}

module.exports = ContactUsDomain;
