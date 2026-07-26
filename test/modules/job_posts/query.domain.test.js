const JobPostsQueryDomain = require("../../../src/modules/job_posts/repositories/queries/domain");
const { NotFoundError } = require("../../../src/helpers/errors");

describe("Job Posts Query Domain", () => {
  let domain;
  let mockQuery;
  let mockWorkerSkillsQuery;

  beforeEach(() => {
    domain = new JobPostsQueryDomain({});
    mockQuery = {
      countAllJobPosts: jest.fn(),
      findAll: jest.fn(),
      findOneByJobpostsId: jest.fn(),
      findAllByRecruiterId: jest.fn(),
    };
    mockWorkerSkillsQuery = { getSkillIdsByWorkerId: jest.fn() };
    domain.query = mockQuery;
    domain.workerSkillsQuery = mockWorkerSkillsQuery;
  });

  describe("getJobPostsLogic", () => {
    it("should return paginated job posts", async () => {
      const items = [{ id: "1", title: "Backend Developer" }];
      const meta = { page: 1, per_page: 12, total_data: 1, total_pages: 1 };
      mockQuery.countAllJobPosts.mockResolvedValue({ data: { rowCount: 1 } });
      mockQuery.findAll.mockResolvedValue({ err: null, data: items, meta });

      const result = await domain.getJobPostsLogic({ page: 1, limit: 12 });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(items);
      expect(result.meta).toEqual(meta);
    });

    it("should return NotFoundError when findAll fails", async () => {
      mockQuery.countAllJobPosts.mockResolvedValue({ data: { rowCount: 0 } });
      mockQuery.findAll.mockResolvedValue({ err: new Error("db error"), data: null });

      const result = await domain.getJobPostsLogic({ page: 1, limit: 12 });

      expect(result.err).toBeInstanceOf(NotFoundError);
    });

    it("should return empty paginated list when no jobs found", async () => {
      mockQuery.countAllJobPosts.mockResolvedValue({ data: { rowCount: 0 } });
      mockQuery.findAll.mockResolvedValue({
        err: "Data Not Found Please Try Another Input",
        data: null,
      });

      const result = await domain.getJobPostsLogic({ page: 1, limit: 10 });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
    });

    it("guest hot listing does not call preference inference", async () => {
      mockQuery.getWorkerHotPreferences = jest.fn();
      mockQuery.countAllJobPosts.mockResolvedValue({ data: { rowCount: 1 } });
      mockQuery.findAll.mockResolvedValue({
        err: null,
        data: [{ id: "hot-1" }],
        meta: { page: 1, per_page: 5, total_data: 1, total_pages: 1 },
      });

      await domain.getJobPostsLogic({ listing: "hot", page: 1, limit: 5 });

      expect(mockQuery.getWorkerHotPreferences).not.toHaveBeenCalled();
      expect(mockQuery.countAllJobPosts).toHaveBeenCalledTimes(1);
      const conditions = mockQuery.countAllJobPosts.mock.calls[0][0];
      expect(conditions).toContain("boost_type = 'hot'");
    });

    it("infers city/category OR filter for logged-in hot listing without explicit filters", async () => {
      mockQuery.getWorkerHotPreferences = jest.fn().mockResolvedValue({
        err: null,
        data: { preferred_city: "Jakarta Selatan", preferred_category_id: 3 },
      });
      mockQuery.countAllJobPosts.mockResolvedValue({ data: { rowCount: 2 } });
      mockQuery.findAll.mockResolvedValue({
        err: null,
        data: [{ id: "hot-1" }, { id: "hot-2" }],
        meta: { page: 1, per_page: 5, total_data: 2, total_pages: 1 },
      });

      await domain.getJobPostsLogic({
        listing: "hot",
        user_id: "worker-1",
        page: 1,
        limit: 5,
      });

      expect(mockQuery.getWorkerHotPreferences).toHaveBeenCalledWith("worker-1");
      const [conditions, values] = mockQuery.countAllJobPosts.mock.calls[0];
      expect(conditions).toMatch(/is_remote = TRUE OR j\.city ILIKE/);
      expect(conditions).toMatch(/category_id =/);
      expect(values).toEqual(expect.arrayContaining(["Jakarta Selatan", 3]));
    });

    it("falls back to all hot when inferred relevance matches nothing", async () => {
      mockQuery.getWorkerHotPreferences = jest.fn().mockResolvedValue({
        err: null,
        data: { preferred_city: "Medan", preferred_category_id: 9 },
      });
      mockQuery.countAllJobPosts
        .mockResolvedValueOnce({ data: { rowCount: 0 } })
        .mockResolvedValueOnce({ data: { rowCount: 3 } });
      mockQuery.findAll.mockResolvedValue({
        err: null,
        data: [{ id: "hot-a" }],
        meta: { page: 1, per_page: 5, total_data: 3, total_pages: 1 },
      });

      const result = await domain.getJobPostsLogic({
        listing: "hot",
        user_id: "worker-1",
        page: 1,
        limit: 5,
      });

      expect(result.err).toBeNull();
      expect(mockQuery.countAllJobPosts).toHaveBeenCalledTimes(2);
      const fallbackConditions = mockQuery.countAllJobPosts.mock.calls[1][0];
      expect(fallbackConditions).not.toMatch(/is_remote = TRUE OR j\.city ILIKE/);
      expect(fallbackConditions).toContain("boost_type = 'hot'");
    });

    it("uses explicit cities_name and skips inference", async () => {
      mockQuery.getWorkerHotPreferences = jest.fn();
      mockQuery.countAllJobPosts.mockResolvedValue({ data: { rowCount: 1 } });
      mockQuery.findAll.mockResolvedValue({
        err: null,
        data: [{ id: "hot-1" }],
        meta: { page: 1, per_page: 5, total_data: 1, total_pages: 1 },
      });

      await domain.getJobPostsLogic({
        listing: "hot",
        user_id: "worker-1",
        cities_name: "Bandung",
        page: 1,
        limit: 5,
      });

      expect(mockQuery.getWorkerHotPreferences).not.toHaveBeenCalled();
      const [conditions, values] = mockQuery.countAllJobPosts.mock.calls[0];
      expect(conditions).toContain("j.city ILIKE");
      expect(values).toContain("Bandung");
    });
  });

  describe("getJobpostById", () => {
    it("should return NotFoundError when job post not found", async () => {
      mockQuery.findOneByJobpostsId.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.getJobpostById({ id: "550e8400-e29b-41d4-a716-446655440000" });

      expect(result.err).toBeInstanceOf(NotFoundError);
    });
  });
});
