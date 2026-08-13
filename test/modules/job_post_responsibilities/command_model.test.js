const commandModel = require("../../../src/modules/job_post_responsibilities/repositories/commands/command_model");
const queryModel = require("../../../src/modules/job_post_responsibilities/repositories/queries/query_model");

describe("Job Post Responsibilities Models", () => {
  const jobPostId = "550e8400-e29b-41d4-a716-446655440000";
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";

  it("should validate add payload", () => {
    const { error } = commandModel.addJobPostResponsibilityParamType.validate({
      job_post_id: jobPostId,
      recruiter_id: recruiterId,
      responsibility: "Manage team",
      order_index: 1,
    });
    expect(error).toBeUndefined();
  });

  it("should reject missing responsibility", () => {
    const { error } = commandModel.addJobPostResponsibilityParamType.validate({
      job_post_id: jobPostId,
      recruiter_id: recruiterId,
      order_index: 1,
    });
    expect(error).toBeDefined();
  });

  it("should validate query param", () => {
    const { error } = queryModel.getAllJobPostResponsibilitiesParam.validate({
      job_post_id: jobPostId,
    });
    expect(error).toBeUndefined();
  });
});
