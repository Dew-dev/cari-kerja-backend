jest.mock("../../../src/modules/job_post_benefits/repositories/queries/query_handler", () => ({
  getAllJobPostBenefitsByJobPostId: jest.fn(),
}));
jest.mock("../../../src/modules/job_post_benefits/repositories/commands/command_handler", () => ({
  insertJobPostBenefit: jest.fn(),
  updateJobPostBenefit: jest.fn(),
  deleteJobPostBenefit: jest.fn(),
}));

const queryHandler = require("../../../src/modules/job_post_benefits/repositories/queries/query_handler");
const commandHandler = require("../../../src/modules/job_post_benefits/repositories/commands/command_handler");
const apiHandler = require("../../../src/modules/job_post_benefits/handlers/api_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("Job Post Benefits API Handler", () => {
  const jobPostId = "550e8400-e29b-41d4-a716-446655440000";
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  let res;

  beforeEach(() => {
    res = createMockResponse();
    jest.clearAllMocks();
  });

  describe("getAllJobPostBenefitsByJobPostId", () => {
    it("should return benefits list", async () => {
      const req = createMockRequest({ params: { job_post_id: jobPostId } });
      const benefits = [{ id: "1", benefit: "Health Insurance" }];
      queryHandler.getAllJobPostBenefitsByJobPostId.mockResolvedValue(wrapper.data(benefits));

      await apiHandler.getAllJobPostBenefitsByJobPostId(req, res);

      expect(queryHandler.getAllJobPostBenefitsByJobPostId).toHaveBeenCalledWith({ job_post_id: jobPostId });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("insertJobPostBenefit", () => {
    it("should insert benefit with recruiter_id from userMeta", async () => {
      const req = createMockRequest({
        params: { job_post_id: jobPostId },
        body: { benefit: "Health Insurance", order_index: 1 },
        userMeta: { recruiter_id: recruiterId },
      });
      commandHandler.insertJobPostBenefit.mockResolvedValue(wrapper.data({ id: "benefit-1" }));

      await apiHandler.insertJobPostBenefit(req, res);

      expect(commandHandler.insertJobPostBenefit).toHaveBeenCalledWith({
        benefit: "Health Insurance",
        order_index: 1,
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
      });
    });
  });

  describe("deleteJobPostBenefit", () => {
    it("should delete benefit on valid request", async () => {
      const req = createMockRequest({
        params: { job_post_id: jobPostId },
        body: { id: "550e8400-e29b-41d4-a716-446655440002" },
        userMeta: { recruiter_id: recruiterId },
      });
      commandHandler.deleteJobPostBenefit.mockResolvedValue(wrapper.data("Successfully deleted"));

      await apiHandler.deleteJobPostBenefit(req, res);

      expect(commandHandler.deleteJobPostBenefit).toHaveBeenCalledWith({
        id: "550e8400-e29b-41d4-a716-446655440002",
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
      });
    });
  });
});
