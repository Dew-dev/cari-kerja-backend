const Command = require("./command");
const { v4: uuidv4 } = require("uuid");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const {
  InternalServerError,
  BadRequestError,
} = require("../../../../helpers/errors");
const { sendMail } = require("../../../../helpers/utils/mailer");
const ctx = "ContactUs-Command-Domain";

class ContactUsDomain {
  constructor(db) {
    this.command = new Command(db);
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

    // Send email to admin
    try {
      const emailHtml = `
        <h2>New Contact Us Message</h2>
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `;

      await sendMail({
        to: process.env.MAIL_USER,
        subject: `[Contact Us] ${subject}`,
        html: emailHtml,
      });
    } catch (err) {
      logger.error(ctx, "sendMail", "Error sending email", err);
      // Don't throw error, just log it
    }

    return wrapper.data(result.data);
  }

  async deleteContactMessage(payload) {
    const { id } = payload;

    if (!id) {
      return wrapper.error(new BadRequestError("id wajib diisi"));
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
