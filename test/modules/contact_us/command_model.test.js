const commandModel = require("../../../src/modules/contact_us/repositories/commands/command_model");

describe("Contact Us Command Model", () => {
  describe("createContactMessageParamType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.createContactMessageParamType.validate({
        name: "John Doe",
        email: "john@example.com",
        subject: "Question about jobs",
        message: "I have a question about applying.",
        phone: "08123456789",
      });
      expect(error).toBeUndefined();
      expect(value.name).toBe("John Doe");
      expect(value.email).toBe("john@example.com");
    });

    it("should reject invalid email", () => {
      const { error } = commandModel.createContactMessageParamType.validate({
        name: "John Doe",
        email: "invalid-email",
        subject: "Question",
        message: "Hello",
      });
      expect(error).toBeDefined();
    });

    it("should reject missing required fields", () => {
      const { error } = commandModel.createContactMessageParamType.validate({
        name: "John Doe",
      });
      expect(error).toBeDefined();
    });

    it("should allow null phone", () => {
      const { error, value } = commandModel.createContactMessageParamType.validate({
        name: "John Doe",
        email: "john@example.com",
        subject: "Question",
        message: "Hello",
        phone: null,
      });
      expect(error).toBeUndefined();
      expect(value.phone).toBeNull();
    });

    it("should reject name exceeding max length", () => {
      const { error } = commandModel.createContactMessageParamType.validate({
        name: "a".repeat(101),
        email: "john@example.com",
        subject: "Question",
        message: "Hello",
      });
      expect(error).toBeDefined();
    });

    it("should reject subject exceeding max length", () => {
      const { error } = commandModel.createContactMessageParamType.validate({
        name: "John Doe",
        email: "john@example.com",
        subject: "s".repeat(300),
        message: "Hello",
      });
      expect(error).toBeDefined();
    });
  });

  describe("deleteContactMessageParamType", () => {
    it("should validate valid uuid id", () => {
      const { error, value } = commandModel.deleteContactMessageParamType.validate({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(error).toBeUndefined();
      expect(value.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should reject invalid uuid", () => {
      const { error } = commandModel.deleteContactMessageParamType.validate({
        id: "not-a-uuid",
      });
      expect(error).toBeDefined();
    });

    it("should reject missing id", () => {
      const { error } = commandModel.deleteContactMessageParamType.validate({});
      expect(error).toBeDefined();
    });
  });
});
