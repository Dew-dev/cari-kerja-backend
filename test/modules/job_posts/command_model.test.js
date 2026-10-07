const commandModel = require("../../../src/modules/job_posts/repositories/commands/command_model");
const queryModel = require("../../../src/modules/job_posts/repositories/queries/query_model");

const jobPostId = "550e8400-e29b-41d4-a716-446655440000";
const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
const workerId = "550e8400-e29b-41d4-a716-446655440002";

describe("Job Posts Command Model", () => {
  it("should validate createJobPost payload", () => {
    const { error } = commandModel.createJobPostParamType.validate({
      recruiter_id: recruiterId,
      title: "Backend Developer",
      description: "Node.js role",
      employment_type_id: 1,
      experience_level_id: 2,
      salary_type_id: 1,
      job_post_status_id: 3,
      salary_min: 5000,
      currency_id: 1,
      category_id: 1,
    });
    expect(error).toBeUndefined();
  });

  it("should validate updateApplicationStatus payload", () => {
    const { error } = commandModel.updateApplicationStatusParamType.validate({
      id: "550e8400-e29b-41d4-a716-446655440003",
      application_status_id: 2,
      recruiter_id: recruiterId,
    });
    expect(error).toBeUndefined();
  });

  it("should validate deleteAppliedJobpost payload", () => {
    const { error } = commandModel.deleteAppliedJobpostParamType.validate({
      job_post_id: jobPostId,
      worker_id: workerId,
    });
    expect(error).toBeUndefined();
  });

  it("should strip application_status_id from createJobApplication payload even if sent by client", () => {
    const { error, value } = commandModel.createJobApplicationParamType.validate({
      job_post_id: jobPostId,
      worker_id: workerId,
      application_status_id: 999,
    });
    expect(error).toBeUndefined();
    expect(value.application_status_id).toBeUndefined();
  });

  it("should validate jobPostStatusUpdate payload including auth recruiter_id", () => {
    const { error } = commandModel.jobPostStatusUpdateParamType.validate({
      id: jobPostId,
      status_id: 1,
      recruiter_id: recruiterId,
    });
    expect(error).toBeUndefined();
  });

  it("should reject jobPostStatusUpdate without recruiter_id", () => {
    const { error } = commandModel.jobPostStatusUpdateParamType.validate({
      id: jobPostId,
      status_id: 1,
    });
    expect(error).toBeDefined();
  });
});

describe("Job Posts Query Model", () => {
  it("should validate getJobpostById param", () => {
    const { error } = queryModel.getJobpostByIdParamType.validate({ id: jobPostId });
    expect(error).toBeUndefined();
  });

  it("should validate getJobpostsSelf param", () => {
    const { error } = queryModel.getJobpostsSelfParamType.validate({ recruiter_id: recruiterId });
    expect(error).toBeUndefined();
  });

  it("should validate getAppliedJobposts param", () => {
    const { error } = queryModel.getAppliedJobpostsParamType.validate({ worker_id: workerId });
    expect(error).toBeUndefined();
  });
});
