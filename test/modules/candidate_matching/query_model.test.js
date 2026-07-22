const queryModel = require("../../../src/modules/candidate_matching/repositories/queries/query_model");
const commandModel = require("../../../src/modules/candidate_matching/repositories/commands/command_model");
const pipelineQueryModel = require("../../../src/modules/candidate_pipeline/repositories/queries/query_model");

describe("Candidate Matching models", () => {
  const uuid = "550e8400-e29b-41d4-a716-446655440000";
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";

  it("validates get match by application", () => {
    const { error } = queryModel.getMatchByApplicationParamType.validate({
      application_id: uuid,
      recruiter_id: recruiterId,
    });
    expect(error).toBeUndefined();
  });

  it("validates rematch job post", () => {
    const { error } = commandModel.rematchJobPostParamType.validate({
      job_post_id: uuid,
      recruiter_id: recruiterId,
    });
    expect(error).toBeUndefined();
  });

  it("accepts pipeline sort=match_score and min_match_score", () => {
    const { error, value } = pipelineQueryModel.getPipelineCandidatesParamType.validate({
      recruiter_id: recruiterId,
      sort: "match_score",
      order: "desc",
      min_match_score: 60,
    });

    expect(error).toBeUndefined();
    expect(value.sort).toBe("match_score");
    expect(value.min_match_score).toBe(60);
  });

  it("rejects invalid pipeline sort", () => {
    const { error } = pipelineQueryModel.getPipelineCandidatesParamType.validate({
      recruiter_id: recruiterId,
      sort: "salary",
    });
    expect(error).toBeDefined();
  });

  it("rejects min_match_score out of range", () => {
    const { error } = pipelineQueryModel.getPipelineCandidatesParamType.validate({
      recruiter_id: recruiterId,
      min_match_score: 150,
    });
    expect(error).toBeDefined();
  });
});
