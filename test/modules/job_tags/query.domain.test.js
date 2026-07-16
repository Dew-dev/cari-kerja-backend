const JobTagsQueryDomain = require("../../../src/modules/job_tags/repositories/queries/domain");
const { NotFoundError } = require("../../../src/helpers/errors");

describe("Job Tags Query Domain", () => {
  let domain;
  let mockQuery;

  beforeEach(() => {
    domain = new JobTagsQueryDomain({});
    mockQuery = {
      findOneJobTag: jest.fn(),
      findJobTag: jest.fn(),
      findOneJobPostTag: jest.fn(),
      findtagsPerJobPost: jest.fn(),
    };
    domain.query = mockQuery;
  });

  describe("getOneTagByName", () => {
    it("should return tag when found", async () => {
      mockQuery.findOneJobTag.mockResolvedValue({ err: null, data: { id: "1", name: "Remote" } });

      const result = await domain.getOneTagByName({ name: "Remote" });

      expect(result.err).toBeNull();
      expect(result.data.name).toBe("Remote");
    });

    it("should return NotFoundError when tag not found", async () => {
      mockQuery.findOneJobTag.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.getOneTagByName({ name: "Unknown" });

      expect(result.err).toBeInstanceOf(NotFoundError);
    });
  });

  describe("getTagsPerJobPost", () => {
    it("should return tags for job post", async () => {
      const tags = [{ id: "1", name: "Remote" }];
      mockQuery.findtagsPerJobPost.mockResolvedValue({ err: null, data: tags });

      const result = await domain.getTagsPerJobPost({
        job_post_id: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(tags);
    });
  });

  describe("getOneJobPostTagByTagIdAndJobPostId", () => {
    it("should return junction record when found", async () => {
      mockQuery.findOneJobPostTag.mockResolvedValue({
        err: null,
        data: { tag_id: "1", job_post_id: "550e8400-e29b-41d4-a716-446655440000" },
      });

      const result = await domain.getOneJobPostTagByTagIdAndJobPostId({
        tag_id: "1",
        job_post_id: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(result.err).toBeNull();
    });
  });
});
