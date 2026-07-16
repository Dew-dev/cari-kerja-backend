const queryModel = require("../../../src/modules/educations/repositories/queries/query_model");

describe("Educations Query Model", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";
  const educationId = "550e8400-e29b-41d4-a716-446655440001";

  describe("getAllEducationsParam", () => {
    it("should validate valid worker_id uuid", () => {
      const { error, value } = queryModel.getAllEducationsParam.validate({
        worker_id: workerId,
      });
      expect(error).toBeUndefined();
      expect(value.worker_id).toBe(workerId);
    });

    it("should reject invalid uuid", () => {
      const { error } = queryModel.getAllEducationsParam.validate({
        worker_id: "not-a-uuid",
      });
      expect(error).toBeDefined();
    });

    it("should reject missing worker_id", () => {
      const { error } = queryModel.getAllEducationsParam.validate({});
      expect(error).toBeDefined();
    });
  });

  describe("getOneEducationParam", () => {
    it("should validate valid payload", () => {
      const { error, value } = queryModel.getOneEducationParam.validate({
        worker_id: workerId,
        id: educationId,
      });
      expect(error).toBeUndefined();
      expect(value.worker_id).toBe(workerId);
      expect(value.id).toBe(educationId);
    });

    it("should reject invalid worker_id uuid", () => {
      const { error } = queryModel.getOneEducationParam.validate({
        worker_id: "invalid",
        id: educationId,
      });
      expect(error).toBeDefined();
    });

    it("should reject invalid id uuid", () => {
      const { error } = queryModel.getOneEducationParam.validate({
        worker_id: workerId,
        id: "invalid",
      });
      expect(error).toBeDefined();
    });

    it("should reject missing id", () => {
      const { error } = queryModel.getOneEducationParam.validate({ worker_id: workerId });
      expect(error).toBeDefined();
    });
  });
});
