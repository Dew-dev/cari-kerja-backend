const queryModel = require("../../../src/modules/categories/repositories/queries/query_model");

describe("Categories Query Model", () => {
  describe("getOneCategoryType", () => {
    it("should validate valid id", () => {
      const { error, value } = queryModel.getOneCategoryType.validate({ id: 1 });
      expect(error).toBeUndefined();
      expect(value.id).toBe(1);
    });

    it("should reject missing id", () => {
      const { error } = queryModel.getOneCategoryType.validate({});
      expect(error).toBeDefined();
    });

    it("should reject non-number id", () => {
      const { error } = queryModel.getOneCategoryType.validate({ id: "abc" });
      expect(error).toBeDefined();
    });
  });

  describe("getAllCategoriesType", () => {
    it("should validate with defaults for page and limit", () => {
      const { error, value } = queryModel.getAllCategoriesType.validate({});
      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
      expect(value.limit).toBe(10);
    });

    it("should validate full payload with search", () => {
      const { error, value } = queryModel.getAllCategoriesType.validate({
        page: 2,
        limit: 20,
        search: "tech",
      });
      expect(error).toBeUndefined();
      expect(value).toEqual({ page: 2, limit: 20, search: "tech" });
    });

    it("should accept optional search", () => {
      const { error, value } = queryModel.getAllCategoriesType.validate({ page: 1, limit: 5 });
      expect(error).toBeUndefined();
      expect(value.search).toBeUndefined();
    });
  });
});
