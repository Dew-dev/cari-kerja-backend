const commandModel = require("../../../src/modules/job_post_requirements/repositories/commands/command_model");
const queryModel = require("../../../src/modules/job_post_requirements/repositories/queries/query_model");

const jobPostId = "550e8400-e29b-41d4-a716-446655440000";
const recruiterId = "550e8400-e29b-41d4-a716-446655440001";

describe("Job Post Requirements Command Model", () => {
  it("should validate add payload", () => {
    const { error } = commandModel.addJobPostRequirementParamType.validate({
      job_post_id: jobPostId,
      recruiter_id: recruiterId,
      requirement: "3+ years experience",
      order_index: 1,
    });
    expect(error).toBeUndefined();
  });

  it("should reject missing requirement", () => {
    const { error } = commandModel.addJobPostRequirementParamType.validate({
      job_post_id: jobPostId,
      recruiter_id: recruiterId,
      order_index: 1,
    });
    expect(error).toBeDefined();
  });

  it("should validate delete payload", () => {
    const { error } = commandModel.deleteJobPostRequirementParamType.validate({
      job_post_id: jobPostId,
      id: "550e8400-e29b-41d4-a716-446655440002",
      recruiter_id: recruiterId,
    });
    expect(error).toBeUndefined();
  });
});

describe("Job Post Requirements Query Model", () => {
  it("should validate getAll param", () => {
    const { error, value } = queryModel.getAllJobPostRequirementsParam.validate({
      job_post_id: jobPostId,
    });
    expect(error).toBeUndefined();
    expect(value.job_post_id).toBe(jobPostId);
  });
});
