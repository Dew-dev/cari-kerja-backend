jest.mock("uuid", () => ({ v4: jest.fn(() => "responsibility-uuid-1234") }));

const JobPostResponsibilitiesDomain = require("../../../src/modules/job_post_responsibilities/repositories/commands/domain");
const {
  NotFoundError,
  InternalServerError,
  ForbiddenError,
} = require("../../../src/helpers/errors");

describe("Job Post Responsibilities Command Domain", () => {
  const jobPostId = "550e8400-e29b-41d4-a716-446655440000";
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  let domain;
  let mockCommand;
  let mockQuery;
  let mockJobPostsDomain;

  beforeEach(() => {
    domain = new JobPostResponsibilitiesDomain({});
    mockCommand = { insertOne: jest.fn(), updateOneNew: jest.fn(), deleteOne: jest.fn() };
    mockQuery = { findOne: jest.fn() };
    mockJobPostsDomain = { getJobpostById: jest.fn() };
    domain.command = mockCommand;
    domain.query = mockQuery;
    domain.domain = mockJobPostsDomain;
  });

  describe("insertOne", () => {
    it("should insert when recruiter owns job post", async () => {
      mockJobPostsDomain.getJobpostById.mockResolvedValue({
        err: null,
        data: { recruiter_id: recruiterId },
      });
      mockCommand.insertOne.mockResolvedValue({ err: null, data: { id: "responsibility-uuid-1234" } });

      const result = await domain.insertOne({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        responsibility: "Manage team",
        order_index: 1,
      });

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ id: "responsibility-uuid-1234" });
      expect(mockCommand.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          responsibility: "Manage team",
          order_index: 1,
        })
      );
    });

    it("should return ForbiddenError for wrong recruiter", async () => {
      mockJobPostsDomain.getJobpostById.mockResolvedValue({
        err: null,
        data: { recruiter_id: "other" },
      });

      const result = await domain.insertOne({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        responsibility: "Manage team",
        order_index: 1,
      });

      expect(result.err).toBeInstanceOf(ForbiddenError);
    });
  });

  describe("updateOne", () => {
    it("should update responsibility when found and recruiter owns job post", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "resp-1" } });
      mockJobPostsDomain.getJobpostById.mockResolvedValue({
        err: null,
        data: { recruiter_id: recruiterId },
      });
      mockCommand.updateOneNew.mockResolvedValue({ err: null, data: true });

      const result = await domain.updateOne({
        id: "resp-1",
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        responsibility: "Lead projects",
        order_index: 2,
      });

      expect(result.err).toBeNull();
      expect(mockCommand.updateOneNew).toHaveBeenCalledWith(
        { id: "resp-1", job_post_id: jobPostId },
        { responsibility: "Lead projects", order_index: 2 }
      );
    });

    it("should return NotFoundError when not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.updateOne({
        id: "resp-1",
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
      });

      expect(result.err).toBeInstanceOf(NotFoundError);
    });
  });

  describe("deleteOne", () => {
    it("should return InternalServerError when delete fails", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "resp-1" } });
      mockJobPostsDomain.getJobpostById.mockResolvedValue({
        err: null,
        data: { recruiter_id: recruiterId },
      });
      mockCommand.deleteOne.mockResolvedValue({ err: new Error("fail"), data: null });

      const result = await domain.deleteOne({
        id: "resp-1",
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
      });

      expect(result.err).toBeInstanceOf(InternalServerError);
    });
  });
});
