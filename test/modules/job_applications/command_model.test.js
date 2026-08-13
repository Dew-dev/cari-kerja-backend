const commandModel = require("../../../src/modules/job_applications/repositories/commands/command_model");
const queryModel = require("../../../src/modules/job_applications/repositories/queries/query_model");

const jobPostId = "550e8400-e29b-41d4-a716-446655440000";
const workerId = "550e8400-e29b-41d4-a716-446655440001";
const recruiterId = "550e8400-e29b-41d4-a716-446655440002";

describe("Job Applications Command Model", () => {
  it("should validate createJobApplication payload", () => {
    const { error } = commandModel.createJobApplicationParamType.validate({
      job_post_id: jobPostId,
      worker_id: workerId,
      application_status_id: 1,
    });
    expect(error).toBeUndefined();
  });

  it("should validate addApplicationNote payload", () => {
    const { error } = commandModel.addApplicationNoteParamType.validate({
      application_id: "550e8400-e29b-41d4-a716-446655440003",
      recruiter_id: recruiterId,
      note: "Good candidate",
    });
    expect(error).toBeUndefined();
  });

  it("should reject empty note", () => {
    const { error } = commandModel.addApplicationNoteParamType.validate({
      application_id: "550e8400-e29b-41d4-a716-446655440003",
      recruiter_id: recruiterId,
      note: "",
    });
    expect(error).toBeDefined();
  });
});

describe("Job Applications Query Model", () => {
  it("should validate getJobpostById param", () => {
    const { error } = queryModel.getJobpostByIdParamType.validate({ id: jobPostId });
    expect(error).toBeUndefined();
  });

  it("should validate getJobposts param", () => {
    const { error } = queryModel.getJobpostsParamType.validate({ page: 1, limit: 10 });
    expect(error).toBeUndefined();
  });
});
