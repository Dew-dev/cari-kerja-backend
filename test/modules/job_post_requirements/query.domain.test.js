const JobPostRequirementsQueryDomain = require("../../../src/modules/job_post_requirements/repositories/queries/domain");
const { NotFoundError } = require("../../../src/helpers/errors");

describe("Job Post Requirements Query Domain", () => {
  let domain;
  let mockQuery;

  beforeEach(() => {
    domain = new JobPostRequirementsQueryDomain({});
    mockQuery = { getAllByJobPostId: jest.fn() };
    domain.query = mockQuery;
  });

  describe("getAllJobPostRequirementsByJobPostId", () => {
    it("should return requirements list when found", async () => {
      const requirements = [{ id: "1", requirement: "Bachelor degree", order_index: 1 }];
      mockQuery.getAllByJobPostId.mockResolvedValue({ err: null, data: requirements });

      const result = await domain.getAllJobPostRequirementsByJobPostId({
        job_post_id: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(requirements);
    });

    it("should return NotFoundError when query fails with unexpected error", async () => {
      mockQuery.getAllByJobPostId.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.getAllJobPostRequirementsByJobPostId({
        job_post_id: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("No job_post_requirements found");
    });

    it("should return empty array when query reports empty result", async () => {
      mockQuery.getAllByJobPostId.mockResolvedValue({
        err: "Data Not Found Please Try Another Input",
        data: null,
      });

      const result = await domain.getAllJobPostRequirementsByJobPostId({
        job_post_id: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
    });
  });
});
