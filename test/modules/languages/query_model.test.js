const queryModel = require("../../../src/modules/languages/repositories/queries/query_model");

describe("Languages Query Model", () => {
  describe("getAllLanguagesParam", () => {
    it("should validate valid uuid worker_id", () => {
      const { error, value } = queryModel.getAllLanguagesParam.validate({
        worker_id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(error).toBeUndefined();
      expect(value.worker_id).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should reject invalid uuid", () => {
      const { error } = queryModel.getAllLanguagesParam.validate({
        worker_id: "not-a-uuid",
      });
      expect(error).toBeDefined();
    });

    it("should reject missing worker_id", () => {
      const { error } = queryModel.getAllLanguagesParam.validate({});
      expect(error).toBeDefined();
    });
  });
});
