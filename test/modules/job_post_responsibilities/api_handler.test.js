jest.mock("../../../src/modules/job_post_responsibilities/repositories/queries/query_handler", () => ({
  getAllJobPostResponsibilitiesByJobPostId: jest.fn(),
}));
jest.mock("../../../src/modules/job_post_responsibilities/repositories/commands/command_handler", () => ({
  insertJobPostResponsibility: jest.fn(),
  updateJobPostResponsibility: jest.fn(),
  deleteJobPostResponsibility: jest.fn(),
}));

const queryHandler = require("../../../src/modules/job_post_responsibilities/repositories/queries/query_handler");
const commandHandler = require("../../../src/modules/job_post_responsibilities/repositories/commands/command_handler");
const apiHandler = require("../../../src/modules/job_post_responsibilities/handlers/api_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("Job Post Responsibilities API Handler", () => {
  const jobPostId = "550e8400-e29b-41d4-a716-446655440000";
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  let res;

  beforeEach(() => {
    res = createMockResponse();
    jest.clearAllMocks();
  });

  it("should get all responsibilities", async () => {
    const req = createMockRequest({ params: { job_post_id: jobPostId } });
    queryHandler.getAllJobPostResponsibilitiesByJobPostId.mockResolvedValue(wrapper.data([]));

    await apiHandler.getAllJobPostResponsibilitiesByJobPostId(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should insert responsibility", async () => {
    const req = createMockRequest({
      params: { job_post_id: jobPostId },
      body: { responsibility: "Manage team", order_index: 1 },
      userMeta: { recruiter_id: recruiterId },
    });
    commandHandler.insertJobPostResponsibility.mockResolvedValue(wrapper.data({ id: "resp-1" }));

    await apiHandler.insertJobPostResponsibility(req, res);

    expect(commandHandler.insertJobPostResponsibility).toHaveBeenCalledWith({
      responsibility: "Manage team",
      order_index: 1,
      job_post_id: jobPostId,
      recruiter_id: recruiterId,
    });
  });
});
