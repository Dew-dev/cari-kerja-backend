jest.mock("../../../src/modules/job_applications/repositories/queries/query_handler", () => ({
  getJobpostById: jest.fn(),
  getJobposts: jest.fn(),
  getJobpostsByRecruiterId: jest.fn(),
  getApplicationNotes: jest.fn(),
}));
jest.mock("../../../src/modules/job_applications/repositories/commands/command_handler", () => ({
  createJobApplication: jest.fn(),
  addApplicationNote: jest.fn(),
  getApplicationNotes: jest.fn(),
}));

const queryHandler = require("../../../src/modules/job_applications/repositories/queries/query_handler");
const commandHandler = require("../../../src/modules/job_applications/repositories/commands/command_handler");
const apiHandler = require("../../../src/modules/job_applications/handlers/api_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("Job Applications API Handler", () => {
  const jobPostId = "550e8400-e29b-41d4-a716-446655440000";
  const workerId = "550e8400-e29b-41d4-a716-446655440001";
  const recruiterId = "550e8400-e29b-41d4-a716-446655440002";
  let res;

  beforeEach(() => {
    res = createMockResponse();
    jest.clearAllMocks();
  });

  it("should get job post by id", async () => {
    const req = createMockRequest({ params: { id: jobPostId } });
    queryHandler.getJobpostById.mockResolvedValue(wrapper.data({ id: jobPostId, title: "Backend" }));

    await apiHandler.getJobpostById(req, res);

    expect(queryHandler.getJobpostById).toHaveBeenCalledWith({ id: jobPostId });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should create job application with worker_id from userMeta", async () => {
    const req = createMockRequest({
      params: { job_post_id: jobPostId },
      body: { application_status_id: 1 },
      userMeta: { worker_id: workerId },
    });
    commandHandler.createJobApplication.mockResolvedValue(wrapper.data({ job_application: { id: "app-1" } }));

    await apiHandler.createJobApplication(req, res);

    expect(commandHandler.createJobApplication).toHaveBeenCalledWith(
      expect.objectContaining({ job_post_id: jobPostId, worker_id: workerId, application_status_id: 1 })
    );
  });

  it("should add application note with recruiter_id from userMeta", async () => {
    const applicationId = "550e8400-e29b-41d4-a716-446655440003";
    const req = createMockRequest({
      params: { id: applicationId },
      body: { note: "Good candidate" },
      userMeta: { recruiter_id: recruiterId },
    });
    commandHandler.addApplicationNote.mockResolvedValue(wrapper.data("Note added"));

    await apiHandler.addApplicationNote(req, res);

    expect(commandHandler.addApplicationNote).toHaveBeenCalledWith({
      application_id: applicationId,
      note: "Good candidate",
      recruiter_id: recruiterId,
    });
  });
});
