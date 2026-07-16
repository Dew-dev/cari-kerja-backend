const RecruitersQueryDomain = require("../../../src/modules/recruiters/repositories/queries/domain");
const { NotFoundError } = require("../../../src/helpers/errors");

describe("Recruiters Query Domain", () => {
  let domain;
  let mockQuery;

  beforeEach(() => {
    domain = new RecruitersQueryDomain({});
    mockQuery = {
      findOneByRecruiterUserId: jest.fn(),
      findAllRecruitersWithIndustry: jest.fn(),
      findAllCompanies: jest.fn(),
      countAll: jest.fn(),
    };
    domain.query = mockQuery;
  });

  describe("getRecruiterByUserId", () => {
    it("should return recruiter when found", async () => {
      const recruiter = { id: "rec-1", company_name: "Acme Corp" };
      mockQuery.findOneByRecruiterUserId.mockResolvedValue({ err: null, data: recruiter });

      const result = await domain.getRecruiterByUserId({ user_id: "user-1" });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(recruiter);
      expect(mockQuery.findOneByRecruiterUserId).toHaveBeenCalledWith("user-1");
    });

    it("should return NotFoundError when recruiter not found", async () => {
      mockQuery.findOneByRecruiterUserId.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.getRecruiterByUserId({ user_id: "user-999" });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Can not find recruiter");
    });
  });

  describe("getAllRecruitersByIndustry", () => {
    it("should group recruiters by industry", async () => {
      mockQuery.findAllRecruitersWithIndustry.mockResolvedValue({
        err: null,
        data: [
          {
            id: "rec-1",
            company_name: "Acme",
            industry_id: 1,
            industry_name: "Tech",
            job_count: "3",
          },
          {
            id: "rec-2",
            company_name: "Beta",
            industry_id: 1,
            industry_name: "Tech",
            job_count: 2,
          },
          {
            id: "rec-3",
            company_name: "Gamma",
            industry_id: null,
            industry_name: null,
            job_count: 0,
          },
        ],
      });

      const result = await domain.getAllRecruitersByIndustry();

      expect(result.err).toBeNull();
      expect(result.data).toHaveLength(2);

      const techGroup = result.data.find((g) => g.industry_id === 1);
      expect(techGroup.total_recruiters).toBe(2);
      expect(techGroup.total_jobs).toBe(5);
      expect(techGroup.recruiters[0].job_count).toBe(3);
      expect(techGroup.recruiters[0].total_job_posts).toBe(3);

      const unassignedGroup = result.data.find((g) => g.industry_id === null);
      expect(unassignedGroup.industry_name).toBe("Unassigned");
      expect(unassignedGroup.total_recruiters).toBe(1);
    });

    it("should return NotFoundError when query fails", async () => {
      mockQuery.findAllRecruitersWithIndustry.mockResolvedValue({ err: new Error("db error"), data: null });

      const result = await domain.getAllRecruitersByIndustry();

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Cannot find recruiters");
    });
  });

  describe("getAllCompanies", () => {
    const payload = { search: "acme", page: 1, limit: 10 };

    it("should return paginated companies with custom meta keys", async () => {
      const companies = [{ id: "rec-1", company_name: "Acme Corp" }];
      mockQuery.findAllCompanies.mockResolvedValue({ err: null, data: companies });
      mockQuery.countAll.mockResolvedValue({ err: null, data: 25 });

      const result = await domain.getAllCompanies(payload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual(companies);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPage: 3,
      });
      expect(mockQuery.findAllCompanies).toHaveBeenCalledWith({
        search: "acme",
        page: 1,
        limit: 10,
      });
    });

    it("should return NotFoundError when companies query fails", async () => {
      mockQuery.findAllCompanies.mockResolvedValue({ err: new Error("db error"), data: null });

      const result = await domain.getAllCompanies(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Cannot find companies");
    });

    it("should return NotFoundError when count query fails", async () => {
      mockQuery.findAllCompanies.mockResolvedValue({ err: null, data: [{ id: "rec-1" }] });
      mockQuery.countAll.mockResolvedValue({ err: new Error("count failed"), data: null });

      const result = await domain.getAllCompanies(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Cannot count companies");
    });
  });
});
