const CandidatePipelineQueryDomain = require("../../../src/modules/candidate_pipeline/repositories/queries/domain");
const { NotFoundError, ForbiddenError } = require("../../../src/helpers/errors");

describe("Candidate Pipeline Query Domain", () => {
  const jobPostId = "550e8400-e29b-41d4-a716-446655440000";
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  const applicationId = "550e8400-e29b-41d4-a716-446655440003";
  let domain;
  let mockQuery;

  beforeEach(() => {
    domain = new CandidatePipelineQueryDomain({});
    mockQuery = {
      findJobPostOwner: jest.fn(),
      ensureStagesForJobPost: jest.fn(),
      findPipelineCandidates: jest.fn(),
      findStageCounts: jest.fn(),
      countTotalApplications: jest.fn(),
      findReachedCounts: jest.fn(),
      findStagesForSingleJobPost: jest.fn(),
      findApplicationContext: jest.fn(),
      findStageHistoryByApplication: jest.fn(),
      findNotesByApplication: jest.fn(),
    };
    domain.query = mockQuery;
  });

  describe("getStages", () => {
    it("should return stages when recruiter owns the job post", async () => {
      mockQuery.findJobPostOwner.mockResolvedValue({ err: null, data: { id: jobPostId, recruiter_id: recruiterId } });
      const stages = [{ id: 1, name: "Applied" }];
      mockQuery.ensureStagesForJobPost.mockResolvedValue({ err: null, data: stages });

      const result = await domain.getStages({ job_post_id: jobPostId, recruiter_id: recruiterId });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(stages);
    });

    it("should return NotFoundError when job post does not exist", async () => {
      mockQuery.findJobPostOwner.mockResolvedValue({ err: null, data: null });

      const result = await domain.getStages({ job_post_id: jobPostId, recruiter_id: recruiterId });

      expect(result.err).toBeInstanceOf(NotFoundError);
    });

    it("should return ForbiddenError when recruiter does not own the job post", async () => {
      mockQuery.findJobPostOwner.mockResolvedValue({
        err: null,
        data: { id: jobPostId, recruiter_id: "other-recruiter" },
      });

      const result = await domain.getStages({ job_post_id: jobPostId, recruiter_id: recruiterId });

      expect(result.err).toBeInstanceOf(ForbiddenError);
    });
  });

  describe("getPipelineCandidates", () => {
    it("should return paginated candidates", async () => {
      const items = [{ application_id: applicationId, name: "Worker" }];
      mockQuery.findPipelineCandidates.mockResolvedValue({ err: null, data: items, meta: { total: 1 } });

      const result = await domain.getPipelineCandidates({ recruiter_id: recruiterId, page: 1, limit: 10 });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([
        {
          application_id: applicationId,
          name: "Worker",
          match_score: 0,
          match_status: "pending",
          match_reasons: [],
        },
      ]);
      expect(result.meta.total).toBe(1);
    });

    it("should preserve explicit zero match scores", async () => {
      mockQuery.findPipelineCandidates.mockResolvedValue({
        err: null,
        data: [
          {
            application_id: applicationId,
            name: "Worker",
            match_score: 0,
            match_status: "ready",
            match_reasons: [{ type: "skills", label: "No overlap", score: 0 }],
          },
        ],
        meta: { total: 1 },
      });

      const result = await domain.getPipelineCandidates({ recruiter_id: recruiterId });

      expect(result.err).toBeNull();
      expect(result.data[0].match_score).toBe(0);
      expect(result.data[0].match_status).toBe("ready");
    });

    it("should return NotFoundError when query fails", async () => {
      mockQuery.findPipelineCandidates.mockResolvedValue({ err: new Error("db error"), data: null });

      const result = await domain.getPipelineCandidates({ recruiter_id: recruiterId });

      expect(result.err).toBeInstanceOf(NotFoundError);
    });
  });

  describe("getPipelineAnalytics", () => {
    it("should build conversion_rates from reached counts", async () => {
      mockQuery.findStageCounts.mockResolvedValue({
        err: null,
        data: [{ stage_id: 1, stage_type: "applied", name: "Applied", count: 10 }],
      });
      mockQuery.countTotalApplications.mockResolvedValue({ err: null, data: 10 });
      mockQuery.findReachedCounts.mockResolvedValue({
        err: null,
        data: [
          { stage_type: "screening", count: 5 },
          { stage_type: "interview", count: 2 },
        ],
      });

      const result = await domain.getPipelineAnalytics({ recruiter_id: recruiterId });

      expect(result.err).toBeNull();
      expect(result.data.stage_counts).toHaveLength(1);
      expect(result.data.conversion_rates).toHaveLength(4);
      expect(result.data.conversion_rates[0]).toMatchObject({
        from_stage_type: "applied",
        to_stage_type: "screening",
        rate: 0.5,
      });
    });
  });

  describe("getApplicationTimeline", () => {
    it("should merge applied, stage_change, and note events chronologically", async () => {
      mockQuery.findApplicationContext.mockResolvedValue({
        err: null,
        data: {
          id: applicationId,
          applied_at: "2026-01-01T00:00:00Z",
          job_post_id: jobPostId,
          recruiter_id: recruiterId,
          job_title: "Backend Developer",
        },
      });
      mockQuery.findStageHistoryByApplication.mockResolvedValue({
        err: null,
        data: [
          {
            id: "history-1",
            created_at: "2026-01-02T00:00:00Z",
            note: null,
            from_name: "Applied",
            to_name: "Screening",
            actor_name: "Recruiter A",
          },
        ],
      });
      mockQuery.findNotesByApplication.mockResolvedValue({
        err: null,
        data: [
          {
            id: "note-1",
            note: "Kandidat cukup baik",
            created_at: "2026-01-03T00:00:00Z",
            actor_name: "Recruiter A",
          },
        ],
      });

      const result = await domain.getApplicationTimeline({
        application_id: applicationId,
        recruiter_id: recruiterId,
      });

      expect(result.err).toBeNull();
      expect(result.data).toHaveLength(3);
      expect(result.data[0].type).toBe("applied");
      expect(result.data[1].type).toBe("stage_change");
      expect(result.data[2].type).toBe("note");
    });

    it("should return ForbiddenError when recruiter does not own the application", async () => {
      mockQuery.findApplicationContext.mockResolvedValue({
        err: null,
        data: { recruiter_id: "other-recruiter" },
      });

      const result = await domain.getApplicationTimeline({
        application_id: applicationId,
        recruiter_id: recruiterId,
      });

      expect(result.err).toBeInstanceOf(ForbiddenError);
    });
  });
});
