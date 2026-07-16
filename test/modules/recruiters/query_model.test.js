const queryModel = require("../../../src/modules/recruiters/repositories/queries/query_model");

describe("Recruiters Query Model", () => {
  describe("getRecruiterByUserIdParamType", () => {
    it("should validate valid payload", () => {
      const { error, value } = queryModel.getRecruiterByUserIdParamType.validate({
        user_id: "user-uuid",
      });
      expect(error).toBeUndefined();
      expect(value.user_id).toBe("user-uuid");
    });

    it("should reject missing user_id", () => {
      const { error } = queryModel.getRecruiterByUserIdParamType.validate({});
      expect(error).toBeDefined();
    });
  });

  describe("getAllRecruitersByIndustryParamType", () => {
    it("should validate empty object", () => {
      const { error } = queryModel.getAllRecruitersByIndustryParamType.validate({});
      expect(error).toBeUndefined();
    });
  });

  describe("getAllCompaniesParamType", () => {
    it("should validate with defaults", () => {
      const { error, value } = queryModel.getAllCompaniesParamType.validate({});
      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
      expect(value.limit).toBe(10);
    });

    it("should accept optional search", () => {
      const { error, value } = queryModel.getAllCompaniesParamType.validate({
        search: "acme",
        page: 2,
        limit: 20,
      });
      expect(error).toBeUndefined();
      expect(value.search).toBe("acme");
    });
  });
});
