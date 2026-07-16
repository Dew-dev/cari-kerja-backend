const commandModel = require("../../../src/modules/job_tags/repositories/commands/command_model");
const queryModel = require("../../../src/modules/job_tags/repositories/queries/query_model");

describe("Job Tags Models", () => {
  const jobPostId = "550e8400-e29b-41d4-a716-446655440000";
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  const tagId = "550e8400-e29b-41d4-a716-446655440002";

  describe("command model", () => {
    it("should validate createJobPostTag payload", () => {
      const { error } = commandModel.createJobPostTagParamType.validate({
        name: "Remote",
        job_post_id: jobPostId,
        role_id: 2,
        recruiter_id: recruiterId,
      });
      expect(error).toBeUndefined();
    });

    it("should validate createJobTag payload", () => {
      const { error } = commandModel.createJobTagParamType.validate({ name: "Remote" });
      expect(error).toBeUndefined();
    });

    it("should validate deleteJobPostTag payload", () => {
      const { error } = commandModel.deleteJobPostTagParamType.validate({
        tag_id: tagId,
        job_post_id: jobPostId,
        role_id: 2,
        recruiter_id: recruiterId,
      });
      expect(error).toBeUndefined();
    });
  });

  describe("query model", () => {
    it("should validate getTagsPerJobPost param", () => {
      const { error } = queryModel.getTagsPerJobPostParamType.validate({ job_post_id: jobPostId });
      expect(error).toBeUndefined();
    });

    it("should validate getOneJobPostTagByTagIdAndJobPostId param", () => {
      const { error } = queryModel.getOneJobPostTagByTagIdAndJobPostIdParamType.validate({
        tag_id: tagId,
        job_post_id: jobPostId,
      });
      expect(error).toBeUndefined();
    });
  });
});
