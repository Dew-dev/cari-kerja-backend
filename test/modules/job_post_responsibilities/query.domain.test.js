const JobPostResponsibilitiesQueryDomain = require("../../../src/modules/job_post_responsibilities/repositories/queries/domain");
const { NotFoundError } = require("../../../src/helpers/errors");

describe("Job Post Responsibilities Query Domain", () => {
  let domain;
  let mockQuery;

  beforeEach(() => {
    domain = new JobPostResponsibilitiesQueryDomain({});
    mockQuery = { getAllByJobPostId: jest.fn() };
    domain.query = mockQuery;
  });

  it("should return responsibilities when found", async () => {
    const data = [{ id: "1", responsibility: "Manage team", order_index: 1 }];
    mockQuery.getAllByJobPostId.mockResolvedValue({ err: null, data });

    const result = await domain.getAllJobPostResponsibilitiesByJobPostId({
      job_post_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result.err).toBeNull();
    expect(result.data).toEqual(data);
  });

  it("should return NotFoundError when not found", async () => {
    mockQuery.getAllByJobPostId.mockResolvedValue({ err: new Error("not found"), data: null });

    const result = await domain.getAllJobPostResponsibilitiesByJobPostId({
      job_post_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result.err).toBeInstanceOf(NotFoundError);
  });
});
