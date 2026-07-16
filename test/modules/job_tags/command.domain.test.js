jest.mock("uuid", () => ({ v4: jest.fn(() => "tag-uuid-1234") }));

jest.mock("../../../src/modules/job_tags/repositories/queries/query_handler", () => ({
  getOneTagByName: jest.fn(),
  getOneJobPostTagByTagIdAndJobPostId: jest.fn(),
}));

jest.mock("../../../src/modules/job_posts/repositories/queries/query_handler", () => ({
  getJobpostById: jest.fn(),
}));

const jobTagsQueryHandler = require("../../../src/modules/job_tags/repositories/queries/query_handler");
const jobPostsQueryHandler = require("../../../src/modules/job_posts/repositories/queries/query_handler");
const JobTagsCommandDomain = require("../../../src/modules/job_tags/repositories/commands/domain");
const {
  NotFoundError,
  InternalServerError,
  UnauthorizedError,
} = require("../../../src/helpers/errors");

describe("Job Tags Command Domain", () => {
  const jobPostId = "550e8400-e29b-41d4-a716-446655440000";
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  const tagId = "550e8400-e29b-41d4-a716-446655440002";
  let domain;
  let mockCommand;

  beforeEach(() => {
    domain = new JobTagsCommandDomain({});
    mockCommand = {
      insertOneJobPostTag: jest.fn(),
      insertJobTag: jest.fn(),
      deleteJobPostTag: jest.fn(),
    };
    domain.command = mockCommand;
    jest.clearAllMocks();
  });

  describe("createJobTag", () => {
    it("should create tag when name does not exist", async () => {
      jobTagsQueryHandler.getOneTagByName.mockResolvedValue({ err: new Error("not found"), data: null });
      mockCommand.insertJobTag.mockResolvedValue({ err: null, data: { id: "tag-uuid-1234" } });

      const result = await domain.createJobTag({ name: "Remote" });

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ id: "tag-uuid-1234", name: "Remote" });
    });

    it("should return error when tag already exists", async () => {
      jobTagsQueryHandler.getOneTagByName.mockResolvedValue({
        err: null,
        data: { id: tagId, name: "Remote" },
      });

      const result = await domain.createJobTag({ name: "Remote" });

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Create Job Tag Failed: Tag already exists");
    });
  });

  describe("createJobPostTag", () => {
    it("should link existing tag to job post for authorized recruiter", async () => {
      jobPostsQueryHandler.getJobpostById.mockResolvedValue({
        err: null,
        data: { recruiter_id: recruiterId },
      });
      jobTagsQueryHandler.getOneTagByName.mockResolvedValue({
        err: null,
        data: { id: tagId, name: "Remote" },
      });
      mockCommand.insertOneJobPostTag.mockResolvedValue({ err: null, data: true });

      const result = await domain.createJobPostTag({
        job_post_id: jobPostId,
        name: "Remote",
        role_id: 2,
        recruiter_id: recruiterId,
      });

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ tag_id: tagId, job_post_id: jobPostId });
    });

    it("should return UnauthorizedError when role is not recruiter", async () => {
      jobPostsQueryHandler.getJobpostById.mockResolvedValue({
        err: null,
        data: { recruiter_id: recruiterId },
      });

      const result = await domain.createJobPostTag({
        job_post_id: jobPostId,
        name: "Remote",
        role_id: 1,
        recruiter_id: recruiterId,
      });

      expect(result.err).toBeInstanceOf(UnauthorizedError);
    });
  });

  describe("deleteJobPostTag", () => {
    it("should delete job post tag when authorized", async () => {
      jobPostsQueryHandler.getJobpostById.mockResolvedValue({
        err: null,
        data: { recruiter_id: recruiterId },
      });
      jobTagsQueryHandler.getOneJobPostTagByTagIdAndJobPostId.mockResolvedValue({
        err: null,
        data: { tag_id: tagId, job_post_id: jobPostId },
      });
      mockCommand.deleteJobPostTag.mockResolvedValue({ err: null, data: true });

      const result = await domain.deleteJobPostTag({
        tag_id: tagId,
        job_post_id: jobPostId,
        role_id: 2,
        recruiter_id: recruiterId,
      });

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ tag_id: tagId, job_post_id: jobPostId });
    });

    it("should return NotFoundError when junction not found", async () => {
      jobPostsQueryHandler.getJobpostById.mockResolvedValue({
        err: null,
        data: { recruiter_id: recruiterId },
      });
      jobTagsQueryHandler.getOneJobPostTagByTagIdAndJobPostId.mockResolvedValue({
        err: new Error("not found"),
        data: null,
      });

      const result = await domain.deleteJobPostTag({
        tag_id: tagId,
        job_post_id: jobPostId,
        role_id: 2,
        recruiter_id: recruiterId,
      });

      expect(result.err).toBeInstanceOf(NotFoundError);
    });
  });
});
