const commandModel = require("../../../src/modules/certifications/repositories/commands/command_model");

describe("Certifications Command Model", () => {
  const validAddPayload = {
    worker_id: "550e8400-e29b-41d4-a716-446655440000",
    name: "AWS Solutions Architect",
    issuer: "Amazon",
    link: "https://aws.amazon.com/cert",
    issue_date: "2024-01-01",
    is_active: true,
  };

  describe("addCertification", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.addCertification.validate(validAddPayload);
      expect(error).toBeUndefined();
      expect(value.name).toBe("AWS Solutions Architect");
    });

    it("should reject missing required fields", () => {
      const { error } = commandModel.addCertification.validate({ worker_id: "abc" });
      expect(error).toBeDefined();
    });

    it("should allow optional expiry_date as null", () => {
      const { error, value } = commandModel.addCertification.validate({
        ...validAddPayload,
        expiry_date: null,
      });
      expect(error).toBeUndefined();
      expect(value.expiry_date).toBeNull();
    });

    it("should allow empty credential_id", () => {
      const { error, value } = commandModel.addCertification.validate({
        ...validAddPayload,
        credential_id: "",
      });
      expect(error).toBeUndefined();
      expect(value.credential_id).toBe("");
    });

    it("should reject non-boolean is_active", () => {
      const { error } = commandModel.addCertification.validate({
        ...validAddPayload,
        is_active: "yes",
      });
      expect(error).toBeDefined();
    });
  });

  describe("updateCertification", () => {
    it("should validate partial update payload", () => {
      const { error, value } = commandModel.updateCertification.validate({
        id: "550e8400-e29b-41d4-a716-446655440001",
        worker_id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Updated Name",
        link: "https://example.com",
      });
      expect(error).toBeUndefined();
      expect(value.name).toBe("Updated Name");
    });

    it("should reject missing id", () => {
      const { error } = commandModel.updateCertification.validate({
        worker_id: "550e8400-e29b-41d4-a716-446655440000",
        link: "https://example.com",
      });
      expect(error).toBeDefined();
    });

    it("should reject missing link", () => {
      const { error } = commandModel.updateCertification.validate({
        id: "550e8400-e29b-41d4-a716-446655440001",
        worker_id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(error).toBeDefined();
    });
  });

  describe("deleteCertification", () => {
    it("should validate valid id", () => {
      const { error, value } = commandModel.deleteCertification.validate({
        id: "550e8400-e29b-41d4-a716-446655440001",
      });
      expect(error).toBeUndefined();
      expect(value.id).toBe("550e8400-e29b-41d4-a716-446655440001");
    });

    it("should reject missing id", () => {
      const { error } = commandModel.deleteCertification.validate({});
      expect(error).toBeDefined();
    });
  });
});
