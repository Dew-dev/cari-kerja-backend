const ResumesQueryDomain = require("../../../src/modules/resumes/repositories/queries/domain");
const { NotFoundError } = require("../../../src/helpers/errors");

describe("Resumes Query Domain", () => {
  let domain;
  let mockQuery;

  beforeEach(() => {
    domain = new ResumesQueryDomain({});
    mockQuery = {
      findOne: jest.fn(),
      findAll: jest.fn(),
      countAll: jest.fn(),
    };
    domain.query = mockQuery;
  });

  describe("getResume", () => {
    const workerId = "550e8400-e29b-41d4-a716-446655440000";

    it("should return resume when found", async () => {
      const resume = {
        id: "resume-1",
        worker_id: workerId,
        resume_url: "/uploads/resumes/cv.pdf",
        title: "My CV",
      };
      mockQuery.findOne.mockResolvedValue({ err: null, data: resume });

      const result = await domain.getResume({ id: "resume-1", worker_id: workerId });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(resume);
      expect(mockQuery.findOne).toHaveBeenCalledWith(
        { id: "resume-1", worker_id: workerId },
        { id: 1, worker_id: 1, resume_url: 1, title: 1, updated_at: 1 }
      );
    });

    it("should return NotFoundError when resume not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.getResume({ id: "missing", worker_id: workerId });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Can not find resume");
    });
  });

  describe("getAllResumes", () => {
    const payload = {
      worker_id: "550e8400-e29b-41d4-a716-446655440000",
      page: 1,
      limit: 10,
    };

    it("should return paginated resumes when found", async () => {
      const resumes = [{ id: "resume-1", title: "My CV" }];
      mockQuery.findAll.mockResolvedValue({ err: null, data: resumes });
      mockQuery.countAll.mockResolvedValue({ err: null, data: 5 });

      const result = await domain.getAllResumes(payload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual(resumes);
      expect(result.meta).toEqual({
        page: 1,
        per_page: 10,
        total_data: 5,
        total_pages: 1,
      });
      expect(mockQuery.findAll).toHaveBeenCalledWith(payload.worker_id, 1, 10);
    });

    it("should return NotFoundError when query fails", async () => {
      mockQuery.findAll.mockResolvedValue({ err: new Error("db error"), data: null });
      mockQuery.countAll.mockResolvedValue({ err: null, data: 0 });

      const result = await domain.getAllResumes(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Can not find resumes");
    });

    it("should clamp total_data to zero when count is invalid", async () => {
      mockQuery.findAll.mockResolvedValue({ err: null, data: [{ id: "resume-1" }] });
      mockQuery.countAll.mockResolvedValue({ err: null, data: null });

      const result = await domain.getAllResumes(payload);

      expect(result.meta.total_data).toBe(0);
      expect(result.meta.total_pages).toBe(0);
    });
  });
});
