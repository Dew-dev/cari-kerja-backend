jest.mock("../../../src/modules/job_post_requirements/repositories/queries/query_handler", () => ({
  getAllJobPostRequirementsByJobPostId: jest.fn(),
}));
jest.mock("../../../src/modules/job_post_requirements/repositories/commands/command_handler", () => ({
  insertJobPostRequirements: jest.fn(),
  updateJobPostRequirements: jest.fn(),
  deleteJobPostRequirements: jest.fn(),
}));

const queryHandler = require("../../../src/modules/job_post_requirements/repositories/queries/query_handler");
const commandHandler = require("../../../src/modules/job_post_requirements/repositories/commands/command_handler");
const apiHandler = require("../../../src/modules/job_post_requirements/handlers/api_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("Job Post Requirements API Handler", () => {
  const jobPostId = "550e8400-e29b-41d4-a716-446655440000";
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  let res;

  beforeEach(() => {
    res = createMockResponse();
    jest.clearAllMocks();
  });

  it("should get all requirements by job post id", async () => {
    const req = createMockRequest({ params: { job_post_id: jobPostId } });
    queryHandler.getAllJobPostRequirementsByJobPostId.mockResolvedValue(wrapper.data([]));

    await apiHandler.getAllJobPostRequirementsByJobPostId(req, res);

    expect(queryHandler.getAllJobPostRequirementsByJobPostId).toHaveBeenCalledWith({ job_post_id: jobPostId });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should insert requirement with recruiter_id", async () => {
    const req = createMockRequest({
      params: { job_post_id: jobPostId },
      body: { requirement: "Bachelor degree", order_index: 1 },
      userMeta: { recruiter_id: recruiterId },
    });
    commandHandler.insertJobPostRequirements.mockResolvedValue(wrapper.data({ id: "req-1" }));

    await apiHandler.insertJobPostRequirements(req, res);

    expect(commandHandler.insertJobPostRequirements).toHaveBeenCalledWith({
      requirement: "Bachelor degree",
      order_index: 1,
      job_post_id: jobPostId,
      recruiter_id: recruiterId,
    });
  });
});
