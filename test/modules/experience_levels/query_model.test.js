const queryModel = require("../../../src/modules/experience_levels/repositories/queries/query_model");

describe("Experience Levels Query Model", () => {
  describe("getOneExperienceLevelType", () => {
    it("should validate valid id", () => {
      const { error, value } = queryModel.getOneExperienceLevelType.validate({ id: 1 });
      expect(error).toBeUndefined();
      expect(value.id).toBe(1);
    });

    it("should reject invalid id", () => {
      const { error } = queryModel.getOneExperienceLevelType.validate({ id: "abc" });
      expect(error).toBeDefined();
    });
  });

  describe("getAllExperienceLevelsType", () => {
    it("should validate with default page", () => {
      const { error, value } = queryModel.getAllExperienceLevelsType.validate({});
      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
    });

    it("should validate full payload", () => {
      const { error, value } = queryModel.getAllExperienceLevelsType.validate({
        page: 2,
        limit: 15,
        search: "senior",
      });
      expect(error).toBeUndefined();
      expect(value).toEqual({ page: 2, limit: 15, search: "senior" });
    });
  });
});
