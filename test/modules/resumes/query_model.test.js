const queryModel = require("../../../src/modules/resumes/repositories/queries/query_model");

describe("Resumes Query Model", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";

  describe("getResumeType", () => {
    it("should validate id and worker_id", () => {
      const { error, value } = queryModel.getResumeType.validate({
        worker_id: workerId,
        id: "resume-uuid",
      });
      expect(error).toBeUndefined();
      expect(value.id).toBe("resume-uuid");
      expect(value.worker_id).toBe(workerId);
    });

    it("should reject missing id", () => {
      const { error } = queryModel.getResumeType.validate({ worker_id: workerId });
      expect(error).toBeDefined();
    });

    it("should reject missing worker_id", () => {
      const { error } = queryModel.getResumeType.validate({});
      expect(error).toBeDefined();
    });
  });

  describe("getAllResumesType", () => {
    it("should validate with defaults", () => {
      const { error, value } = queryModel.getAllResumesType.validate({ worker_id: workerId });
      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
      expect(value.limit).toBe(10);
    });

    it("should accept custom pagination", () => {
      const { error, value } = queryModel.getAllResumesType.validate({
        worker_id: workerId,
        page: 2,
        limit: 20,
      });
      expect(error).toBeUndefined();
      expect(value.page).toBe(2);
      expect(value.limit).toBe(20);
    });
  });
});
