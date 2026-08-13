const CandidatePipelineQueryDomain = require("../../../src/modules/candidate_pipeline/repositories/queries/domain");
const CandidateMatchingQueryDomain = require("../../../src/modules/candidate_matching/repositories/queries/domain");
const { NotFoundError, ForbiddenError } = require("../../../src/helpers/errors");

describe("Pipeline candidates include match fields", () => {
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  const applicationId = "550e8400-e29b-41d4-a716-446655440003";

  it("forwards sort and min_match_score to query", async () => {
    const domain = new CandidatePipelineQueryDomain({});
    const mockQuery = {
      findPipelineCandidates: jest.fn().mockResolvedValue({
        err: null,
        data: [
          {
            application_id: applicationId,
            name: "Worker",
            match_score: 88,
            match_status: "ready",
            match_breakdown: { skills: 90 },
            match_reasons: [{ type: "skills", label: "overlap", score: 90 }],
            match_computed_at: new Date().toISOString(),
          },
        ],
        meta: { total: 1 },
      }),
    };
    domain.query = mockQuery;

    const result = await domain.getPipelineCandidates({
      recruiter_id: recruiterId,
      sort: "match_score",
      order: "desc",
      min_match_score: 50,
      page: 1,
      limit: 10,
    });

    expect(result.err).toBeNull();
    expect(result.data[0].match_score).toBe(88);
    expect(result.data[0].match_status).toBe("ready");
    expect(mockQuery.findPipelineCandidates).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: "match_score",
        order: "desc",
        min_match_score: 50,
      }),
    );
  });
});

describe("Candidate Matching Query Domain", () => {
  const applicationId = "550e8400-e29b-41d4-a716-446655440003";
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  const jobPostId = "550e8400-e29b-41d4-a716-446655440000";

  it("returns pending when score row missing", async () => {
    const domain = new CandidateMatchingQueryDomain({});
    domain.query = {
      findApplicationContext: jest.fn().mockResolvedValue({
        err: null,
        data: {
          application_id: applicationId,
          job_post_id: jobPostId,
          worker_id: "550e8400-e29b-41d4-a716-446655440002",
          recruiter_id: recruiterId,
        },
      }),
      findMatchByApplication: jest.fn().mockResolvedValue({ err: null, data: null }),
    };

    const result = await domain.getMatchByApplication({
      application_id: applicationId,
      recruiter_id: recruiterId,
    });

    expect(result.err).toBeNull();
    expect(result.data.match_status).toBe("failed");
    expect(result.data.match_score).toBe(0);
  });

  it("forbids other recruiters", async () => {
    const domain = new CandidateMatchingQueryDomain({});
    domain.query = {
      findApplicationContext: jest.fn().mockResolvedValue({
        err: null,
        data: {
          application_id: applicationId,
          recruiter_id: "other-recruiter",
          job_post_id: jobPostId,
          worker_id: "550e8400-e29b-41d4-a716-446655440002",
        },
      }),
      findMatchByApplication: jest.fn(),
    };

    const result = await domain.getMatchByApplication({
      application_id: applicationId,
      recruiter_id: recruiterId,
    });

    expect(result.err).toBeInstanceOf(ForbiddenError);
  });

  it("returns NotFound when application missing", async () => {
    const domain = new CandidateMatchingQueryDomain({});
    domain.query = {
      findApplicationContext: jest.fn().mockResolvedValue({ err: null, data: null }),
      findMatchByApplication: jest.fn(),
    };

    const result = await domain.getMatchByApplication({
      application_id: applicationId,
      recruiter_id: recruiterId,
    });

    expect(result.err).toBeInstanceOf(NotFoundError);
  });
});
