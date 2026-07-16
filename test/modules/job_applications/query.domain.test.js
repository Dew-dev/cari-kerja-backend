const JobApplicationsQueryDomain = require("../../../src/modules/job_applications/repositories/queries/domain");
const { NotFoundError } = require("../../../src/helpers/errors");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("Job Applications Query Domain", () => {
  let domain;
  let mockQuery;

  beforeEach(() => {
    domain = new JobApplicationsQueryDomain({});
    mockQuery = {
      findAllByRecruiterId: jest.fn(),
      findOneByJobpostsId: jest.fn(),
      findAll: jest.fn(),
    };
    domain.query = mockQuery;
  });

  describe("getJobpostById", () => {
    it("should return job post when found", async () => {
      const jobPost = { id: "550e8400-e29b-41d4-a716-446655440000", title: "Backend Developer" };
      mockQuery.findOneByJobpostsId.mockResolvedValue({ err: null, data: jobPost });

      const result = await domain.getJobpostById({ id: jobPost.id });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(jobPost);
    });

    it("should return NotFoundError when job post not found", async () => {
      mockQuery.findOneByJobpostsId.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.getJobpostById({ id: "550e8400-e29b-41d4-a716-446655440000" });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Can not find the job post");
    });
  });

  describe("getJobpostsByRecruiterId", () => {
    it("should return paginated job posts", async () => {
      const items = [{ id: "1", title: "Backend Developer" }];
      const meta = { page: 1, per_page: 10, total_data: 1, total_pages: 1 };
      mockQuery.findAllByRecruiterId.mockResolvedValue({
        err: null,
        data: items,
        meta,
      });

      const result = await domain.getJobpostsByRecruiterId({ recruiter_id: "rec-1" });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(items);
      expect(result.meta).toEqual(meta);
    });
  });

  describe("getJobposts", () => {
    it("should return paginated public job posts", async () => {
      const items = [{ id: "1", title: "Frontend Developer" }];
      const meta = { page: 1, per_page: 10, total_data: 1, total_pages: 1 };
      mockQuery.findAll.mockResolvedValue({
        err: null,
        data: items,
        meta,
      });

      const result = await domain.getJobposts({ page: 1, limit: 10 });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(items);
    });

    it("should return NotFoundError when query fails", async () => {
      mockQuery.findAll.mockResolvedValue({ err: new Error("db error"), data: null });

      const result = await domain.getJobposts({ page: 1, limit: 10 });

      expect(result.err).toBeInstanceOf(NotFoundError);
    });
  });
});
