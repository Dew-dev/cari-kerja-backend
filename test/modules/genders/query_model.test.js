const queryModel = require("../../../src/modules/genders/repositories/queries/query_model");

describe("Genders Query Model", () => {
  describe("getOneGenderType", () => {
    it("should validate valid id", () => {
      const { error, value } = queryModel.getOneGenderType.validate({ id: 1 });
      expect(error).toBeUndefined();
      expect(value.id).toBe(1);
    });

    it("should reject invalid id", () => {
      const { error } = queryModel.getOneGenderType.validate({ id: "abc" });
      expect(error).toBeDefined();
    });
  });

  describe("getAllGendersType", () => {
    it("should validate with defaults", () => {
      const { error, value } = queryModel.getAllGendersType.validate({});
      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
      expect(value.limit).toBe(10);
    });

    it("should validate full payload", () => {
      const { error, value } = queryModel.getAllGendersType.validate({
        page: 2,
        limit: 20,
        search: "male",
      });
      expect(error).toBeUndefined();
      expect(value).toEqual({ page: 2, limit: 20, search: "male" });
    });
  });
});
