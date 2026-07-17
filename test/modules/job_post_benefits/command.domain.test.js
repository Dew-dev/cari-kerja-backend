jest.mock("uuid", () => ({ v4: jest.fn(() => "benefit-uuid-1234") }));

const JobPostBenefitsDomain = require("../../../src/modules/job_post_benefits/repositories/commands/domain");
const {
  NotFoundError,
  InternalServerError,
  ForbiddenError,
} = require("../../../src/helpers/errors");

describe("Job Post Benefits Command Domain", () => {
  const jobPostId = "550e8400-e29b-41d4-a716-446655440000";
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  let domain;
  let mockCommand;
  let mockQuery;
  let mockJobPostsDomain;

  beforeEach(() => {
    domain = new JobPostBenefitsDomain({});
    mockCommand = { insertOne: jest.fn(), updateOneNew: jest.fn(), deleteOne: jest.fn() };
    mockQuery = { findOne: jest.fn() };
    mockJobPostsDomain = { getJobpostById: jest.fn() };
    domain.command = mockCommand;
    domain.query = mockQuery;
    domain.domain = mockJobPostsDomain;
  });

  describe("insertOne", () => {
    it("should insert benefit when recruiter owns job post", async () => {
      mockJobPostsDomain.getJobpostById.mockResolvedValue({
        err: null,
        data: { recruiter_id: recruiterId },
      });
      mockCommand.insertOne.mockResolvedValue({ err: null, data: { id: "benefit-uuid-1234" } });

      const result = await domain.insertOne({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        benefit: "Health Insurance",
        order_index: 1,
      });

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ id: "benefit-uuid-1234" });
      expect(mockCommand.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "benefit-uuid-1234",
          job_post_id: jobPostId,
          benefit: "Health Insurance",
          order_index: 1,
        })
      );
    });

    it("should return ForbiddenError when recruiter does not own job post", async () => {
      mockJobPostsDomain.getJobpostById.mockResolvedValue({
        err: null,
        data: { recruiter_id: "other-recruiter" },
      });

      const result = await domain.insertOne({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        benefit: "Health Insurance",
        order_index: 1,
      });

      expect(result.err).toBeInstanceOf(ForbiddenError);
      expect(mockCommand.insertOne).not.toHaveBeenCalled();
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
        benefit: "Health Insurance",
        order_index: 1,
      });

      expect(result.err).toBeInstanceOf(InternalServerError);
    });
  });

  describe("updateOne", () => {
    it("should update benefit when record exists and recruiter owns job post", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "benefit-1" } });
      mockJobPostsDomain.getJobpostById.mockResolvedValue({
        err: null,
        data: { recruiter_id: recruiterId },
      });
      mockCommand.updateOneNew.mockResolvedValue({ err: null, data: true });

      const result = await domain.updateOne({
        id: "benefit-1",
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        benefit: "Updated Benefit",
        order_index: 2,
      });

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ id: "benefit-1" });
    });

    it("should return NotFoundError when benefit not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.updateOne({
        id: "benefit-1",
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
      });

      expect(result.err).toBeInstanceOf(NotFoundError);
    });
  });

  describe("deleteOne", () => {
    it("should delete benefit when record exists and recruiter owns job post", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "benefit-1" } });
      mockJobPostsDomain.getJobpostById.mockResolvedValue({
        err: null,
        data: { recruiter_id: recruiterId },
      });
      mockCommand.deleteOne.mockResolvedValue({ err: null, data: true });

      const result = await domain.deleteOne({
        id: "benefit-1",
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
      });

      expect(result.err).toBeNull();
      expect(result.data).toBe("Successfully deleted");
    });

    it("should return NotFoundError when benefit not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.deleteOne({
        id: "benefit-1",
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
      });

      expect(result.err).toBeInstanceOf(NotFoundError);
    });
  });
});
