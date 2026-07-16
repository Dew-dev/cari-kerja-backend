jest.mock("uuid", () => ({ v4: jest.fn(() => "requirement-uuid-1234") }));

const JobPostRequirementsDomain = require("../../../src/modules/job_post_requirements/repositories/commands/domain");
const {
  NotFoundError,
  InternalServerError,
  UnauthorizedError,
} = require("../../../src/helpers/errors");

describe("Job Post Requirements Command Domain", () => {
  const jobPostId = "550e8400-e29b-41d4-a716-446655440000";
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  let domain;
  let mockCommand;
  let mockQuery;
  let mockJobPostsDomain;

  beforeEach(() => {
    domain = new JobPostRequirementsDomain({});
    mockCommand = { insertOne: jest.fn(), updateOneNew: jest.fn(), deleteOne: jest.fn() };
    mockQuery = { findOne: jest.fn() };
    mockJobPostsDomain = { getJobpostById: jest.fn() };
    domain.command = mockCommand;
    domain.query = mockQuery;
    domain.domain = mockJobPostsDomain;
  });

  describe("insertOne", () => {
    it("should insert requirement when recruiter owns job post", async () => {
      mockJobPostsDomain.getJobpostById.mockResolvedValue({
        err: null,
        data: { recruiter_id: recruiterId },
      });
      mockCommand.insertOne.mockResolvedValue({ err: null, data: { id: "requirement-uuid-1234" } });

      const result = await domain.insertOne({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        requirement: "Bachelor degree",
        order_index: 1,
      });

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ id: "requirement-uuid-1234" });
      expect(mockCommand.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          requirement: "Bachelor degree",
          order_index: 1,
        })
      );
    });

    it("should return UnauthorizedError when recruiter does not own job post", async () => {
      mockJobPostsDomain.getJobpostById.mockResolvedValue({
        err: null,
        data: { recruiter_id: "other-recruiter" },
      });

      const result = await domain.insertOne({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        requirement: "Bachelor degree",
        order_index: 1,
      });

      expect(result.err).toBeInstanceOf(UnauthorizedError);
    });

    it("should return InternalServerError when insert fails", async () => {
      mockJobPostsDomain.getJobpostById.mockResolvedValue({
        err: null,
        data: { recruiter_id: recruiterId },
      });
      mockCommand.insertOne.mockResolvedValue({ err: new Error("db error"), data: null });

      const result = await domain.insertOne({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        requirement: "Bachelor degree",
        order_index: 1,
      });

      expect(result.err).toBeInstanceOf(InternalServerError);
    });
  });

  describe("updateOne", () => {
    it("should update requirement when record exists", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "req-1" } });
      mockCommand.updateOneNew.mockResolvedValue({ err: null, data: true });

      const result = await domain.updateOne({
        id: "req-1",
        job_post_id: jobPostId,
        requirement: "Updated requirement",
        order_index: 2,
      });

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ id: "req-1" });
    });

    it("should return NotFoundError when requirement not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.updateOne({ id: "req-1", job_post_id: jobPostId });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("JobPostRequirement not found");
    });
  });

  describe("deleteOne", () => {
    it("should delete requirement when record exists", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "req-1" } });
      mockCommand.deleteOne.mockResolvedValue({ err: null, data: true });

      const result = await domain.deleteOne({ id: "req-1", job_post_id: jobPostId });

      expect(result.err).toBeNull();
      expect(result.data).toBe("Successfully deleted");
    });
  });
});
