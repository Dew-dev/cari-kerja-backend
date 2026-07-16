jest.mock("uuid", () => ({
  v4: jest.fn(() => "contact-uuid-1234"),
}));

jest.mock("../../../src/helpers/queues/email.queue", () => ({
  addEmailJob: jest.fn().mockResolvedValue(undefined),
}));

const { addEmailJob } = require("../../../src/helpers/queues/email.queue");
const ContactUsCommandDomain = require("../../../src/modules/contact_us/repositories/commands/domain");
const {
  InternalServerError,
  BadRequestError,
} = require("../../../src/helpers/errors");

describe("Contact Us Command Domain", () => {
  let domain;
  let mockCommand;

  beforeEach(() => {
    domain = new ContactUsCommandDomain({});
    mockCommand = {
      insertOne: jest.fn(),
      deleteOne: jest.fn(),
    };
    domain.command = mockCommand;
    addEmailJob.mockClear();
    process.env.MAIL_USER = "admin@example.com";
  });

  describe("createContactMessage", () => {
    const validPayload = {
      name: "John Doe",
      email: "john@example.com",
      subject: "Question",
      message: "Hello, I have a question.",
      phone: "08123456789",
    };

    it("should return inserted data when create succeeds", async () => {
      const insertedData = { id: "contact-uuid-1234", ...validPayload };
      mockCommand.insertOne.mockResolvedValue({ err: null, data: insertedData });

      const result = await domain.createContactMessage(validPayload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual(insertedData);
      expect(mockCommand.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "contact-uuid-1234",
          name: "John Doe",
          email: "john@example.com",
          subject: "Question",
          message: "Hello, I have a question.",
          phone: "08123456789",
        })
      );
    });

    it("should set phone to null when not provided", async () => {
      const payloadWithoutPhone = {
        name: "John Doe",
        email: "john@example.com",
        subject: "Question",
        message: "Hello",
      };
      mockCommand.insertOne.mockResolvedValue({
        err: null,
        data: { id: "contact-uuid-1234", ...payloadWithoutPhone, phone: null },
      });

      await domain.createContactMessage(payloadWithoutPhone);

      expect(mockCommand.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({ phone: null })
      );
    });

    it("should send email notification to admin", async () => {
      mockCommand.insertOne.mockResolvedValue({
        err: null,
        data: { id: "contact-uuid-1234", ...validPayload },
      });

      await domain.createContactMessage(validPayload);

      expect(addEmailJob).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "admin@example.com",
          subject: "[Contact Us] Question",
        })
      );
    });

    it("should not fail when email sending throws error", async () => {
      mockCommand.insertOne.mockResolvedValue({
        err: null,
        data: { id: "contact-uuid-1234", ...validPayload },
      });
      addEmailJob.mockRejectedValue(new Error("email queue error"));

      const result = await domain.createContactMessage(validPayload);

      expect(result.err).toBeNull();
      expect(result.data).toBeDefined();
    });

    it("should return BadRequestError when required fields missing", async () => {
      const result = await domain.createContactMessage({ name: "John" });

      expect(result.err).toBeInstanceOf(BadRequestError);
      expect(result.err.message).toBe("name, email, subject, dan message wajib diisi");
      expect(mockCommand.insertOne).not.toHaveBeenCalled();
    });

    it("should return InternalServerError when insert fails", async () => {
      mockCommand.insertOne.mockResolvedValue({ err: new Error("db error"), data: null });

      const result = await domain.createContactMessage(validPayload);

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Failed insert contact message");
    });
  });

  describe("deleteContactMessage", () => {
    it("should return deleted data when delete succeeds", async () => {
      mockCommand.deleteOne.mockResolvedValue({ err: null, data: { id: "contact-uuid-1234" } });

      const result = await domain.deleteContactMessage({ id: "contact-uuid-1234" });

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ id: "contact-uuid-1234" });
      expect(mockCommand.deleteOne).toHaveBeenCalledWith({ id: "contact-uuid-1234" });
    });

    it("should return BadRequestError when id is missing", async () => {
      const result = await domain.deleteContactMessage({});

      expect(result.err).toBeInstanceOf(BadRequestError);
      expect(result.err.message).toBe("id wajib diisi");
      expect(mockCommand.deleteOne).not.toHaveBeenCalled();
    });

    it("should return InternalServerError when delete fails", async () => {
      mockCommand.deleteOne.mockResolvedValue({ err: new Error("delete failed"), data: null });

      const result = await domain.deleteContactMessage({ id: "contact-uuid-1234" });

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Failed delete contact message");
    });
  });
});
