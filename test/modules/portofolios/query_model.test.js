const queryModel = require("../../../src/modules/portofolios/repositories/queries/query_model");

describe("Portofolios Query Model", () => {
  describe("getAllPortofoliosParam", () => {
    it("should validate valid uuid worker_id", () => {
      const { error, value } = queryModel.getAllPortofoliosParam.validate({
        worker_id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(error).toBeUndefined();
      expect(value.worker_id).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should reject invalid uuid", () => {
      const { error } = queryModel.getAllPortofoliosParam.validate({
        worker_id: "not-a-uuid",
      });
      expect(error).toBeDefined();
    });
  });
});
