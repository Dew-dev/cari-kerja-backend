const Query = require("../../../src/modules/candidate_pipeline/repositories/queries/query");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("findPipelineCandidates resilience", () => {
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  const jobPostId = "550e8400-e29b-41d4-a716-446655440000";

  it("retries without match scores when ams join query returns null", async () => {
    const rows = [
      {
        application_id: "550e8400-e29b-41d4-a716-446655440003",
        worker_id: "550e8400-e29b-41d4-a716-446655440002",
        name: "Worker",
        email: "w@example.com",
        match_score: 0,
        match_status: "pending",
      },
    ];

    let call = 0;
    const db = {
      executeQuery: jest.fn(async () => {
        call += 1;
        // First attempt count (with ams) fails → retry without ams
        if (call === 1) return null;
        if (call === 2) return { rows: [{ total: "1" }] };
        return { rows };
      }),
    };

    const query = new Query(db);
    const result = await query.findPipelineCandidates({
      recruiter_id: recruiterId,
      jobPostIds: [jobPostId],
      limit: 10,
      offset: 0,
    });

    expect(result.err).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe("Worker");
    expect(result.meta.total).toBe(1);
    expect(db.executeQuery).toHaveBeenCalledTimes(3);
  });

  it("returns explicit empty list (not error) when there are zero rows", async () => {
    const db = {
      executeQuery: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ total: "0" }] })
        .mockResolvedValueOnce({ rows: [] }),
    };

    const query = new Query(db);
    const result = await query.findPipelineCandidates({
      recruiter_id: recruiterId,
      jobPostIds: [jobPostId],
      limit: 10,
      offset: 0,
    });

    expect(result.err).toBeNull();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
  });

  it("returns wrapper error when both match and fallback queries fail", async () => {
    const db = {
      executeQuery: jest.fn().mockResolvedValue(null),
    };

    const query = new Query(db);
    const result = await query.findPipelineCandidates({
      recruiter_id: recruiterId,
      jobPostIds: [jobPostId],
      limit: 10,
      offset: 0,
    });

    expect(result.err).toBeTruthy();
    expect(result.data).toBeNull();
  });
});

describe("paginationResponse empty list", () => {
  const { paginationResponse } = require("../../../src/helpers/utils/wrapper");

  it("sends 200 with data=[] and meta for empty success payload", () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    paginationResponse(
      res,
      "success",
      wrapper.paginationData([], { page: 1, limit: 10, total: 0, totalPage: 0 }),
      "ok",
      200,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: [],
        code: 200,
        meta: expect.objectContaining({ total: 0 }),
      }),
    );
  });
});
