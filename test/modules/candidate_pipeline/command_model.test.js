const commandModel = require("../../../src/modules/candidate_pipeline/repositories/commands/command_model");

describe("Candidate Pipeline Command Model", () => {
  const jobPostId = "550e8400-e29b-41d4-a716-446655440000";
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";

  describe("createStageParamType", () => {
    it("should validate a valid payload", () => {
      const { error } = commandModel.createStageParamType.validate({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        name: "Technical Test",
      });

      expect(error).toBeUndefined();
    });

    it("should default stage_type to custom", () => {
      const { value, error } = commandModel.createStageParamType.validate({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        name: "Technical Test",
      });

      expect(error).toBeUndefined();
      expect(value.stage_type).toBe("custom");
    });

    it("should reject invalid stage_type", () => {
      const { error } = commandModel.createStageParamType.validate({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        name: "Technical Test",
        stage_type: "invalid_type",
      });

      expect(error).toBeDefined();
    });

    it("should require name", () => {
      const { error } = commandModel.createStageParamType.validate({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
      });

      expect(error).toBeDefined();
    });
  });

  describe("updateStageParamType", () => {
    it("should validate a valid partial update", () => {
      const { error } = commandModel.updateStageParamType.validate({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        stage_id: 1,
        color: "#FFFFFF",
      });

      expect(error).toBeUndefined();
    });
  });

  describe("reorderStagesParamType", () => {
    it("should validate a valid stages array", () => {
      const { error } = commandModel.reorderStagesParamType.validate({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        stages: [{ id: 1, position: 0 }, { id: 2, position: 1 }],
      });

      expect(error).toBeUndefined();
    });

    it("should reject empty stages array", () => {
      const { error } = commandModel.reorderStagesParamType.validate({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        stages: [],
      });

      expect(error).toBeDefined();
    });
  });

  describe("deleteStageParamType", () => {
    it("should validate a valid payload", () => {
      const { error } = commandModel.deleteStageParamType.validate({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        stage_id: 1,
      });

      expect(error).toBeUndefined();
    });
  });
});
