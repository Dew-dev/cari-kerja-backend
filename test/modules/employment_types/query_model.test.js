const queryModel = require("../../../src/modules/employment_types/repositories/queries/query_model");

describe("Employment Types Query Model", () => {
  describe("getOneEmploymentTypeType", () => {
    it("should validate valid id", () => {
      const { error, value } = queryModel.getOneEmploymentTypeType.validate({ id: 1 });
      expect(error).toBeUndefined();
      expect(value.id).toBe(1);
    });

    it("should reject invalid id", () => {
      const { error } = queryModel.getOneEmploymentTypeType.validate({ id: "abc" });
      expect(error).toBeDefined();
    });
  });

  describe("getAllEmploymentTypesType", () => {
    it("should validate with default page", () => {
      const { error, value } = queryModel.getAllEmploymentTypesType.validate({});
      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
    });

    it("should validate full payload", () => {
      const { error, value } = queryModel.getAllEmploymentTypesType.validate({
        page: 2,
        limit: 20,
        search: "full",
      });
      expect(error).toBeUndefined();
      expect(value).toEqual({ page: 2, limit: 20, search: "full" });
    });

    it("should allow optional limit", () => {
      const { error, value } = queryModel.getAllEmploymentTypesType.validate({ page: 1 });
      expect(error).toBeUndefined();
      expect(value.limit).toBeUndefined();
    });
  });
});
