const JobPostBenefitsQueryDomain = require("../../../src/modules/job_post_benefits/repositories/queries/domain");
const { NotFoundError } = require("../../../src/helpers/errors");

describe("Job Post Benefits Query Domain", () => {
  let domain;
  let mockQuery;

  beforeEach(() => {
    domain = new JobPostBenefitsQueryDomain({});
    mockQuery = { getAllByJobPostId: jest.fn() };
    domain.query = mockQuery;
  });

  describe("getAllJobPostBenefitsByJobPostId", () => {
    it("should return benefits list when found", async () => {
      const benefits = [{ id: "1", benefit: "Health Insurance", order_index: 1 }];
      mockQuery.getAllByJobPostId.mockResolvedValue({ err: null, data: benefits });

      const result = await domain.getAllJobPostBenefitsByJobPostId({
        job_post_id: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(benefits);
    });

    it("should return NotFoundError when no benefits found", async () => {
      mockQuery.getAllByJobPostId.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.getAllJobPostBenefitsByJobPostId({
        job_post_id: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("No JobPostBenefits found");
    });
  });
});
