/**
 * QA Bug-Hunting Tests — job_tags
 */
jest.mock("uuid", () => ({
  v4: jest.fn(() => "tag-uuid-1234"),
}));

jest.mock("../../../src/modules/job_tags/repositories/queries/query_handler", () => ({
  getOneTagByName: jest.fn(),
}));

jest.mock("../../../src/modules/job_posts/repositories/queries/query_handler", () => ({
  getJobpostById: jest.fn(),
}));

const JobTagsCommandDomain = require("../../../src/modules/job_tags/repositories/commands/domain");
const JobTagsQueryDomain = require("../../../src/modules/job_tags/repositories/queries/domain");
const tagQueryHandler = require("../../../src/modules/job_tags/repositories/queries/query_handler");
const jobPostQueryHandler = require("../../../src/modules/job_posts/repositories/queries/query_handler");
const {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} = require("../../../src/helpers/errors");

describe("[QA] job_tags module", () => {
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  const jobPostId = "550e8400-e29b-41d4-a716-446655440010";
  const tagId = "550e8400-e29b-41d4-a716-446655440020";

  beforeEach(() => {
    jest.clearAllMocks();
    jobPostQueryHandler.getJobpostById.mockResolvedValue({
      err: null,
      data: { id: jobPostId, recruiter_id: recruiterId },
    });
  });

  describe("Business logic — duplicate tag name", () => {
    it("[BUG-JT-001] createJobTag should return ConflictError when tag already exists", async () => {
      tagQueryHandler.getOneTagByName.mockResolvedValue({
        err: null,
        data: { id: tagId, name: "Remote" },
      });

      const domain = new JobTagsCommandDomain({});
      domain.command = { insertJobTag: jest.fn() };

      const result = await domain.createJobTag({ name: "Remote" });

      expect(result.err).toBeInstanceOf(ConflictError);
      expect(domain.command.insertJobTag).not.toHaveBeenCalled();
    });
  });

  describe("Null handling — tag lookup for job post tag", () => {
    it("[BUG-JT-002] createJobPostTag should create tag when lookup returns null data", async () => {
      tagQueryHandler.getOneTagByName.mockResolvedValue({ err: null, data: null });

      const domain = new JobTagsCommandDomain({});
      domain.createJobTag = jest
        .fn()
        .mockResolvedValue({ err: null, data: { id: "new-tag-id" } });
      domain.command = {
        insertOneJobPostTag: jest.fn().mockResolvedValue({ err: null, data: true }),
      };

      await domain.createJobPostTag({
        job_post_id: jobPostId,
        name: "Hybrid",
        role_id: 2,
        recruiter_id: recruiterId,
      });

      expect(domain.createJobTag).toHaveBeenCalledWith({ name: "Hybrid" });
      expect(domain.command.insertOneJobPostTag).toHaveBeenCalledWith("new-tag-id", jobPostId);
    });
  });

  describe("Query — empty tags list", () => {
    it("[BUG-JT-003] getTagsPerJobPost should return empty array when job has no tags", async () => {
      const domain = new JobTagsQueryDomain({});
      domain.query = {
        findtagsPerJobPost: jest.fn().mockResolvedValue({
          err: "Data Not Found Please Try Another Input",
          data: null,
        }),
      };

      const result = await domain.getTagsPerJobPost({ job_post_id: jobPostId });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
    });
  });

  describe("Security — standalone tag creation", () => {
    it("[BUG-JT-004] POST /api/v1/tags should require recruiter role middleware", () => {
      let middlewares = [];

      const mockServer = {
        get: jest.fn(),
        post: jest.fn((path, ...handlers) => {
          if (path === "/api/v1/tags") {
            middlewares = handlers.slice(0, -1);
          }
        }),
        delete: jest.fn(),
      };

      jest.isolateModules(() => {
        require("../../../src/routes/job_tags")(mockServer);
      });

      const middlewareNames = middlewares.map((fn) => fn.name || String(fn));
      expect(middlewareNames.some((name) => /role|recruiter/i.test(name))).toBe(true);
    });
  });

  describe("Error handling — duplicate job post tag link", () => {
    it("[BUG-JT-005] createJobPostTag should return ConflictError on duplicate link", async () => {
      tagQueryHandler.getOneTagByName.mockResolvedValue({
        err: null,
        data: { id: tagId, name: "Remote" },
      });

      const domain = new JobTagsCommandDomain({});
      domain.command = {
        insertOneJobPostTag: jest.fn().mockResolvedValue({
          err: new Error("duplicate key value violates unique constraint"),
          data: null,
        }),
      };

      const result = await domain.createJobPostTag({
        job_post_id: jobPostId,
        name: "Remote",
        role_id: 2,
        recruiter_id: recruiterId,
      });

      expect(result.err).toBeInstanceOf(ConflictError);
    });
  });

  describe("Security — createJobTag role enforcement", () => {
    it("[BUG-JT-006] createJobTag should reject callers without recruiter role", async () => {
      tagQueryHandler.getOneTagByName.mockResolvedValue({ err: null, data: null });

      const domain = new JobTagsCommandDomain({});
      domain.command = {
        insertJobTag: jest.fn().mockResolvedValue({
          err: null,
          data: { id: tagId, name: "Remote" },
        }),
      };

      const result = await domain.createJobTag({ name: "Remote", role_id: 3 });

      expect(result.err).toBeInstanceOf(UnauthorizedError);
      expect(domain.command.insertJobTag).not.toHaveBeenCalled();
    });
  });
});
