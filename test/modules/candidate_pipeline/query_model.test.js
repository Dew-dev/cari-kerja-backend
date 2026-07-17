const queryModel = require("../../../src/modules/candidate_pipeline/repositories/queries/query_model");

describe("Candidate Pipeline Query Model", () => {
  const jobPostId = "550e8400-e29b-41d4-a716-446655440000";
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";

  describe("getStagesParamType", () => {
    it("should validate a valid payload", () => {
      const { error } = queryModel.getStagesParamType.validate({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
      });

      expect(error).toBeUndefined();
    });
  });

  describe("getPipelineCandidatesParamType", () => {
    it("should accept job_post_id as comma-separated string", () => {
      const { error, value } = queryModel.getPipelineCandidatesParamType.validate({
        recruiter_id: recruiterId,
        job_post_id: `${jobPostId},550e8400-e29b-41d4-a716-446655440002`,
      });

      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
      expect(value.limit).toBe(10);
    });

    it("should accept job_post_id as array", () => {
      const { error } = queryModel.getPipelineCandidatesParamType.validate({
        recruiter_id: recruiterId,
        job_post_id: [jobPostId],
      });

      expect(error).toBeUndefined();
    });

    it("should reject invalid stage_type", () => {
      const { error } = queryModel.getPipelineCandidatesParamType.validate({
        recruiter_id: recruiterId,
        stage_type: "not_a_real_stage",
      });

      expect(error).toBeDefined();
    });
  });

  describe("getPipelineAnalyticsParamType", () => {
    it("should validate without job_post_id filter", () => {
      const { error } = queryModel.getPipelineAnalyticsParamType.validate({
        recruiter_id: recruiterId,
      });

      expect(error).toBeUndefined();
    });
  });

  describe("getApplicationTimelineParamType", () => {
    it("should require application_id and recruiter_id", () => {
      const { error } = queryModel.getApplicationTimelineParamType.validate({
        recruiter_id: recruiterId,
      });

      expect(error).toBeDefined();
    });
  });
});
