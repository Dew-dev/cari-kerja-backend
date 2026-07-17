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
  });

  describe("getJobpostById", () => {
    it("should return NotFoundError when job post not found", async () => {
      mockQuery.findOneByJobpostsId.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.getJobpostById({ id: "550e8400-e29b-41d4-a716-446655440000" });

      expect(result.err).toBeInstanceOf(NotFoundError);
    });
  });
});
