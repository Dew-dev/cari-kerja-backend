const queryModel = require("../../../src/modules/industries/repositories/queries/query_model");

describe("Industries Query Model", () => {
  describe("getOneIndustryType", () => {
    it("should validate valid id", () => {
      const { error, value } = queryModel.getOneIndustryType.validate({ id: 1 });
      expect(error).toBeUndefined();
      expect(value.id).toBe(1);
    });

    it("should reject invalid id", () => {
      const { error } = queryModel.getOneIndustryType.validate({ id: "abc" });
      expect(error).toBeDefined();
    });
  });

  describe("getAllIndustriesType", () => {
    it("should validate with defaults", () => {
      const { error, value } = queryModel.getAllIndustriesType.validate({});
      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
      expect(value.limit).toBe(10);
    });

    it("should validate full payload", () => {
      const { error, value } = queryModel.getAllIndustriesType.validate({
        page: 2,
        limit: 20,
        search: "tech",
      });
      expect(error).toBeUndefined();
      expect(value).toEqual({ page: 2, limit: 20, search: "tech" });
    });
  });
});
