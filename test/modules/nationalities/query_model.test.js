const queryModel = require("../../../src/modules/nationalities/repositories/queries/query_model");

describe("Nationalities Query Model", () => {
  describe("getOneNationalityType", () => {
    it("should validate valid payload", () => {
      const { error, value } = queryModel.getOneNationalityType.validate({ id: 1 });
      expect(error).toBeUndefined();
      expect(value.id).toBe(1);
    });

    it("should reject missing id", () => {
      const { error } = queryModel.getOneNationalityType.validate({});
      expect(error).toBeDefined();
    });
  });

  describe("getAllNationalitiesType", () => {
    it("should validate valid payload with defaults", () => {
      const { error, value } = queryModel.getAllNationalitiesType.validate({});
      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
      expect(value.limit).toBe(10);
    });

    it("should accept optional search", () => {
      const { error, value } = queryModel.getAllNationalitiesType.validate({
        page: 2,
        limit: 20,
        search: "indo",
      });
      expect(error).toBeUndefined();
      expect(value.search).toBe("indo");
    });
  });
});
