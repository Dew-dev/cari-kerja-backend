const commandModel = require("../../../src/modules/educations/repositories/commands/command_model");

describe("Educations Command Model", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";
  const educationId = "550e8400-e29b-41d4-a716-446655440001";

  const validAddPayload = {
    worker_id: workerId,
    institution_name: "University of Indonesia",
    degree: "Bachelor",
    start_date: "2018-09-01",
  };

  describe("addEducationsParamType", () => {
    it("should validate minimal required payload with defaults", () => {
      const { error, value } = commandModel.addEducationsParamType.validate(validAddPayload);
      expect(error).toBeUndefined();
      expect(value.is_current).toBe(false);
    });

    it("should validate full payload", () => {
      const { error, value } = commandModel.addEducationsParamType.validate({
        worker_id: workerId,
        institution_name: "University of Indonesia",
        degree: "Bachelor",
        major: "Computer Science",
        start_date: "2018-09-01",
        end_date: "2022-06-01",
        is_current: false,
        description: "Graduated with honors",
      });
      expect(error).toBeUndefined();
      expect(value.institution_name).toBe("University of Indonesia");
    });

    it("should reject missing institution_name and degree", () => {
      const { error } = commandModel.addEducationsParamType.validate({
        worker_id: workerId,
        start_date: "2018-09-01",
      });
      expect(error).toBeDefined();
    });

    it("should reject institution_name exceeding max length", () => {
      const { error } = commandModel.addEducationsParamType.validate({
        ...validAddPayload,
        institution_name: "a".repeat(151),
      });
      expect(error).toBeDefined();
    });

    it("should allow null end_date", () => {
      const { error, value } = commandModel.addEducationsParamType.validate({
        ...validAddPayload,
        end_date: null,
        is_current: true,
      });
      expect(error).toBeUndefined();
      expect(value.end_date).toBeNull();
    });

    it("should reject invalid start_date format", () => {
      const { error } = commandModel.addEducationsParamType.validate({
        ...validAddPayload,
        start_date: "not-a-date",
      });
      expect(error).toBeDefined();
    });
  });

  describe("updateEducationsParamType", () => {
    it("should validate full update payload", () => {
      const { error, value } = commandModel.updateEducationsParamType.validate({
        id: educationId,
        worker_id: workerId,
        institution_name: "Updated University",
        degree: "Master",
        major: "Data Science",
        start_date: "2022-09-01",
        end_date: "2024-06-01",
        is_current: false,
        description: "Updated",
      });
      expect(error).toBeUndefined();
      expect(value.id).toBe(educationId);
    });

    it("should reject missing required fields", () => {
      const { error } = commandModel.updateEducationsParamType.validate({
        id: educationId,
        worker_id: workerId,
      });
      expect(error).toBeDefined();
    });

    it("should reject missing id", () => {
      const { error } = commandModel.updateEducationsParamType.validate({
        worker_id: workerId,
        institution_name: "University",
        degree: "Bachelor",
        start_date: "2018-09-01",
      });
      expect(error).toBeDefined();
    });

    it("should allow null major and description", () => {
      const { error, value } = commandModel.updateEducationsParamType.validate({
        id: educationId,
        worker_id: workerId,
        institution_name: "University",
        degree: "Bachelor",
        start_date: "2018-09-01",
        major: null,
        description: null,
      });
      expect(error).toBeUndefined();
      expect(value.major).toBeNull();
    });

    it("should reject invalid start_date format", () => {
      const { error } = commandModel.updateEducationsParamType.validate({
        id: educationId,
        worker_id: workerId,
        institution_name: "University",
        degree: "Bachelor",
        start_date: "not-a-date",
        is_current: false,
      });
      expect(error).toBeDefined();
    });
  });

  describe("deleteEducationsParamType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.deleteEducationsParamType.validate({
        worker_id: workerId,
        id: educationId,
      });
      expect(error).toBeUndefined();
      expect(value.worker_id).toBe(workerId);
      expect(value.id).toBe(educationId);
    });

    it("should reject missing worker_id", () => {
      const { error } = commandModel.deleteEducationsParamType.validate({ id: educationId });
      expect(error).toBeDefined();
    });

    it("should reject missing id", () => {
      const { error } = commandModel.deleteEducationsParamType.validate({ worker_id: workerId });
      expect(error).toBeDefined();
    });
  });
});
