jest.mock("../../../src/modules/job_tags/repositories/queries/query_handler", () => ({
  getOneTagByName: jest.fn(),
  getTagByName: jest.fn(),
  getTagsPerJobPost: jest.fn(),
  getOneJobPostTagByTagIdAndJobPostId: jest.fn(),
}));
jest.mock("../../../src/modules/job_tags/repositories/commands/command_handler", () => ({
  createJobPostTag: jest.fn(),
  createJobTag: jest.fn(),
  deleteJobPostTag: jest.fn(),
}));

const queryHandler = require("../../../src/modules/job_tags/repositories/queries/query_handler");
const commandHandler = require("../../../src/modules/job_tags/repositories/commands/command_handler");
const apiHandler = require("../../../src/modules/job_tags/handlers/api_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("Job Tags API Handler", () => {
  const jobPostId = "550e8400-e29b-41d4-a716-446655440000";
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  const tagId = "550e8400-e29b-41d4-a716-446655440002";
  let res;

  beforeEach(() => {
    res = createMockResponse();
    jest.clearAllMocks();
  });

  it("should get tags per job post", async () => {
    const req = createMockRequest({ params: { job_post_id: jobPostId } });
    queryHandler.getTagsPerJobPost.mockResolvedValue(wrapper.data([{ id: tagId, name: "Remote" }]));

    await apiHandler.getTagsPerJobPost(req, res);

    expect(queryHandler.getTagsPerJobPost).toHaveBeenCalledWith({ job_post_id: jobPostId });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should create job post tag with userMeta", async () => {
    const req = createMockRequest({
      params: { job_post_id: jobPostId },
      body: { name: "Remote" },
      userMeta: { role_id: 2, recruiter_id: recruiterId },
    });
    commandHandler.createJobPostTag.mockResolvedValue(wrapper.data({ tag_id: tagId, job_post_id: jobPostId }));

    await apiHandler.createJobPostTag(req, res);

    expect(commandHandler.createJobPostTag).toHaveBeenCalledWith({
      name: "Remote",
      job_post_id: jobPostId,
      role_id: 2,
      recruiter_id: recruiterId,
    });
  });

  it("should create standalone job tag", async () => {
    const req = createMockRequest({ body: { name: "Remote" } });
    commandHandler.createJobTag.mockResolvedValue(wrapper.data({ id: tagId, name: "Remote" }));

    await apiHandler.createJobTag(req, res);

    expect(commandHandler.createJobTag).toHaveBeenCalledWith({ name: "Remote" });
  });

  it("should delete job post tag", async () => {
    const req = createMockRequest({
      params: { job_post_id: jobPostId, tag_id: tagId },
      body: {},
      userMeta: { role_id: 2, recruiter_id: recruiterId },
    });
    commandHandler.deleteJobPostTag.mockResolvedValue(wrapper.data({ tag_id: tagId, job_post_id: jobPostId }));

    await apiHandler.deleteJobPostTag(req, res);

    expect(commandHandler.deleteJobPostTag).toHaveBeenCalledWith({
      tag_id: tagId,
      job_post_id: jobPostId,
      role_id: 2,
      recruiter_id: recruiterId,
    });
  });
});
