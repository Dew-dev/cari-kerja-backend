const queryModel = require("../../../src/modules/job_post_benefits/repositories/queries/query_model");

describe("Job Post Benefits Query Model", () => {
  describe("getAllJobPostBenefitsParam", () => {
    it("should validate job_post_id", () => {
      const { error, value } = queryModel.getAllJobPostBenefitsParam.validate({
        job_post_id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(error).toBeUndefined();
      expect(value.job_post_id).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should reject missing job_post_id", () => {
      const { error } = queryModel.getAllJobPostBenefitsParam.validate({});
      expect(error).toBeDefined();
    });
  });
});
