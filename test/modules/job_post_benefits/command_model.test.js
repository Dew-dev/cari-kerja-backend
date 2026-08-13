const commandModel = require("../../../src/modules/job_post_benefits/repositories/commands/command_model");

const jobPostId = "550e8400-e29b-41d4-a716-446655440000";
const recruiterId = "550e8400-e29b-41d4-a716-446655440001";

describe("Job Post Benefits Command Model", () => {
  describe("addJobPostBenefitParamType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.addJobPostBenefitParamType.validate({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        benefit: "Health Insurance",
        order_index: 1,
      });
      expect(error).toBeUndefined();
      expect(value.benefit).toBe("Health Insurance");
    });

    it("should reject missing benefit", () => {
      const { error } = commandModel.addJobPostBenefitParamType.validate({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        order_index: 1,
      });
      expect(error).toBeDefined();
    });
  });

  describe("updateJobPostBenefitParamType", () => {
    it("should validate partial update", () => {
      const { error } = commandModel.updateJobPostBenefitParamType.validate({
        id: "550e8400-e29b-41d4-a716-446655440002",
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        benefit: "Updated",
      });
      expect(error).toBeUndefined();
    });
  });

  describe("deleteJobPostBenefitParamType", () => {
    it("should validate delete payload", () => {
      const { error } = commandModel.deleteJobPostBenefitParamType.validate({
        job_post_id: jobPostId,
        id: "550e8400-e29b-41d4-a716-446655440002",
        recruiter_id: recruiterId,
      });
      expect(error).toBeUndefined();
    });
  });
});
