jest.mock("../../../src/modules/candidate_pipeline/repositories/queries/query_handler", () => ({
  getStages: jest.fn(),
  getPipelineCandidates: jest.fn(),
  getPipelineAnalytics: jest.fn(),
  getApplicationTimeline: jest.fn(),
}));

jest.mock("../../../src/modules/candidate_pipeline/repositories/commands/command_handler", () => ({
  createStage: jest.fn(),
  updateStage: jest.fn(),
  reorderStages: jest.fn(),
  deleteStage: jest.fn(),
}));

const queryHandler = require("../../../src/modules/candidate_pipeline/repositories/queries/query_handler");
const commandHandler = require("../../../src/modules/candidate_pipeline/repositories/commands/command_handler");
const apiHandler = require("../../../src/modules/candidate_pipeline/handlers/api_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("Candidate Pipeline API Handler", () => {
  const jobPostId = "550e8400-e29b-41d4-a716-446655440000";
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  let res;

  beforeEach(() => {
    res = createMockResponse();
    jest.clearAllMocks();
  });

  describe("getStages", () => {
    it("should return stages for a valid request", async () => {
      const req = createMockRequest({ params: { id: jobPostId }, userMeta: { recruiter_id: recruiterId } });
      queryHandler.getStages.mockResolvedValue(wrapper.data([{ id: 1, name: "Applied" }]));

      await apiHandler.getStages(req, res);

      expect(queryHandler.getStages).toHaveBeenCalledWith({ job_post_id: jobPostId, recruiter_id: recruiterId });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error for invalid job_post_id", async () => {
      const req = createMockRequest({ params: { id: "not-a-uuid" }, userMeta: { recruiter_id: recruiterId } });

      await apiHandler.getStages(req, res);

      expect(queryHandler.getStages).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("createStage", () => {
    it("should create stage on valid request", async () => {
      const req = createMockRequest({
        params: { id: jobPostId },
        body: { name: "Technical Test" },
        userMeta: { recruiter_id: recruiterId },
      });
      commandHandler.createStage.mockResolvedValue(wrapper.data({ id: 7 }));

      await apiHandler.createStage(req, res);

      expect(commandHandler.createStage).toHaveBeenCalledWith(
        expect.objectContaining({ job_post_id: jobPostId, recruiter_id: recruiterId, name: "Technical Test" }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should return validation error when name is missing", async () => {
      const req = createMockRequest({
        params: { id: jobPostId },
        body: {},
        userMeta: { recruiter_id: recruiterId },
      });

      await apiHandler.createStage(req, res);

      expect(commandHandler.createStage).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("deleteStage", () => {
    it("should delete stage on valid request", async () => {
      const req = createMockRequest({
        params: { id: jobPostId, stageId: "2" },
        userMeta: { recruiter_id: recruiterId },
      });
      commandHandler.deleteStage.mockResolvedValue(wrapper.data("Stage deleted successfully"));

      await apiHandler.deleteStage(req, res);

      expect(commandHandler.deleteStage).toHaveBeenCalledWith({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        stage_id: 2,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getPipelineCandidates", () => {
    it("should return paginated candidates", async () => {
      const req = createMockRequest({
        query: { page: "1", limit: "10" },
        userMeta: { recruiter_id: recruiterId },
      });
      const meta = { page: 1, limit: 10, total: 1, totalPage: 1 };
      queryHandler.getPipelineCandidates.mockResolvedValue(wrapper.paginationData([{ application_id: "a1" }], meta));

      await apiHandler.getPipelineCandidates(req, res);

      expect(queryHandler.getPipelineCandidates).toHaveBeenCalledWith(
        expect.objectContaining({ recruiter_id: recruiterId, page: 1, limit: 10 }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getPipelineAnalytics", () => {
    it("should return analytics for a valid request", async () => {
      const req = createMockRequest({ query: {}, userMeta: { recruiter_id: recruiterId } });
      queryHandler.getPipelineAnalytics.mockResolvedValue(
        wrapper.data({ stage_counts: [], conversion_rates: [] }),
      );

      await apiHandler.getPipelineAnalytics(req, res);

      expect(queryHandler.getPipelineAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({ recruiter_id: recruiterId }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getApplicationTimeline", () => {
    it("should return timeline events for a valid request", async () => {
      const applicationId = "550e8400-e29b-41d4-a716-446655440003";
      const req = createMockRequest({
        params: { id: applicationId },
        userMeta: { recruiter_id: recruiterId },
      });
      queryHandler.getApplicationTimeline.mockResolvedValue(wrapper.data([{ id: "applied-1", type: "applied" }]));

      await apiHandler.getApplicationTimeline(req, res);

      expect(queryHandler.getApplicationTimeline).toHaveBeenCalledWith({
        application_id: applicationId,
        recruiter_id: recruiterId,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
