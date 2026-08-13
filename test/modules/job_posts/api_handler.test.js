jest.mock("../../../src/modules/job_posts/repositories/queries/query_handler", () => ({
  getJobpostById: jest.fn(),
  getJobposts: jest.fn(),
  getJobpostsSelf: jest.fn(),
  getAppliedJobposts: jest.fn(),
  archiveJobPost: jest.fn(),
  deleteJobPost: jest.fn(),
  updateApplicationStatus: jest.fn(),
}));
jest.mock("../../../src/modules/job_posts/repositories/commands/command_handler", () => ({
  createJobPost: jest.fn(),
  createJobApplication: jest.fn(),
  deleteAppliedJobpost: jest.fn(),
  updateApplicationStatus: jest.fn(),
  archiveJobPost: jest.fn(),
  deleteJobPost: jest.fn(),
}));

const queryHandler = require("../../../src/modules/job_posts/repositories/queries/query_handler");
const commandHandler = require("../../../src/modules/job_posts/repositories/commands/command_handler");
const apiHandler = require("../../../src/modules/job_posts/handlers/api_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("Job Posts API Handler", () => {
  const jobPostId = "550e8400-e29b-41d4-a716-446655440000";
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  const workerId = "550e8400-e29b-41d4-a716-446655440002";
  let res;

  beforeEach(() => {
    res = createMockResponse();
    jest.clearAllMocks();
  });

  it("should get job post by id with optional worker user_id", async () => {
    const req = createMockRequest({
      params: { id: jobPostId },
      userMeta: { worker_id: workerId },
    });
    queryHandler.getJobpostById.mockResolvedValue(wrapper.data({ id: jobPostId, title: "Backend" }));

    await apiHandler.getJobpostById(req, res);

    expect(queryHandler.getJobpostById).toHaveBeenCalledWith({
      id: jobPostId,
      user_id: workerId,
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should create job post with recruiter_id from userMeta", async () => {
    const body = {
      title: "Backend Developer",
      description: "Node.js role",
      employment_type_id: 1,
      experience_level_id: 2,
      salary_type_id: 1,
      job_post_status_id: 3,
      salary_min: 5000,
      currency_id: 1,
      category_id: 1,
    };
    const req = createMockRequest({ body, userMeta: { recruiter_id: recruiterId } });
    commandHandler.createJobPost.mockResolvedValue(wrapper.data({ id: jobPostId, ...body }));

    await apiHandler.createJobPost(req, res);

    expect(commandHandler.createJobPost).toHaveBeenCalledWith(
      expect.objectContaining({
        ...body,
        recruiter_id: recruiterId,
        status_id: 3,
        is_remote: false,
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("should delete applied job post for worker", async () => {
    const req = createMockRequest({
      params: { job_post_id: jobPostId },
      userMeta: { worker_id: workerId },
    });
    commandHandler.deleteAppliedJobpost.mockResolvedValue(
      wrapper.data("Application withdrawn successfully")
    );

    await apiHandler.deleteAppliedJobpost(req, res);

    expect(commandHandler.deleteAppliedJobpost).toHaveBeenCalledWith({
      job_post_id: jobPostId,
      worker_id: workerId,
    });
  });

  it("should archive job post for recruiter", async () => {
    const req = createMockRequest({
      params: { id: jobPostId },
      userMeta: { recruiter_id: recruiterId },
    });
    commandHandler.archiveJobPost.mockResolvedValue(wrapper.data("Job archived"));

    await apiHandler.archiveJobPost(req, res);

    expect(commandHandler.archiveJobPost).toHaveBeenCalledWith({
      id: jobPostId,
      recruiter_id: recruiterId,
    });
  });
});
