jest.mock("../../../src/modules/recruiters/repositories/commands/command_handler", () => ({
  updateOneRecruiter: jest.fn(),
  updateRecruiterVip: jest.fn(),
}));

jest.mock("../../../src/modules/recruiters/repositories/queries/query_handler", () => ({
  getRecruiterByUserId: jest.fn(),
  getAllRecruitersByIndustry: jest.fn(),
  getAllCompanies: jest.fn(),
}));

const commandHandler = require("../../../src/modules/recruiters/repositories/commands/command_handler");
const queryHandler = require("../../../src/modules/recruiters/repositories/queries/query_handler");
const apiHandler = require("../../../src/modules/recruiters/handlers/api_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("Recruiters API Handler", () => {
  const userId = "550e8400-e29b-41d4-a716-446655440000";
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  let res;

  beforeEach(() => {
    res = createMockResponse();
    jest.clearAllMocks();
  });

  describe("getRecruiterByUserId", () => {
    it("should return recruiter on valid request", async () => {
      const req = createMockRequest({ params: { user_id: userId } });
      const recruiter = { id: recruiterId, company_name: "Acme Corp" };
      queryHandler.getRecruiterByUserId.mockResolvedValue(wrapper.data(recruiter));

      await apiHandler.getRecruiterByUserId(req, res);

      expect(queryHandler.getRecruiterByUserId).toHaveBeenCalledWith({ user_id: userId });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error when user_id missing", async () => {
      const req = createMockRequest({ params: {} });

      await apiHandler.getRecruiterByUserId(req, res);

      expect(queryHandler.getRecruiterByUserId).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getAllRecruitersByIndustry", () => {
    it("should return grouped recruiters", async () => {
      const req = createMockRequest();
      const grouped = [{ industry_id: 1, industry_name: "Tech", recruiters: [] }];
      queryHandler.getAllRecruitersByIndustry.mockResolvedValue(wrapper.data(grouped));

      await apiHandler.getAllRecruitersByIndustry(req, res);

      expect(queryHandler.getAllRecruitersByIndustry).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getAllCompanies", () => {
    it("should return paginated companies", async () => {
      const req = createMockRequest({ query: { page: "1", limit: "10", search: "acme" } });
      const companies = [{ id: recruiterId, company_name: "Acme Corp" }];
      queryHandler.getAllCompanies.mockResolvedValue(
        wrapper.paginationData(companies, { page: 1, limit: 10, total: 1, totalPage: 1 })
      );

      await apiHandler.getAllCompanies(req, res);

      expect(queryHandler.getAllCompanies).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: "acme",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("updateOneRecruiter", () => {
    it("should update recruiter on valid request", async () => {
      const req = createMockRequest({
        params: { id: recruiterId },
        body: { user_id: userId, company_name: "Acme Updated" },
      });
      commandHandler.updateOneRecruiter.mockResolvedValue(wrapper.data({ id: recruiterId }));

      await apiHandler.updateOneRecruiter(req, res);

      expect(commandHandler.updateOneRecruiter).toHaveBeenCalledWith({
        id: recruiterId,
        user_id: userId,
        company_name: "Acme Updated",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("updateOneRecruiterSelf", () => {
    it("should update recruiter using userMeta and optional avatar", async () => {
      const req = createMockRequest({
        userMeta: { id: userId, recruiter_id: recruiterId },
        body: { company_name: "Self Updated" },
        file: { filename: "avatar.png" },
      });
      commandHandler.updateOneRecruiter.mockResolvedValue(wrapper.data({ id: recruiterId }));

      await apiHandler.updateOneRecruiterSelf(req, res);

      expect(commandHandler.updateOneRecruiter).toHaveBeenCalledWith({
        user_id: userId,
        id: recruiterId,
        company_name: "Self Updated",
        avatar_url: "/uploads/avatars/recruiter/avatar.png",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("updateRecruiterVipSelf", () => {
    it("should update vip status on valid request", async () => {
      const req = createMockRequest({
        userMeta: { id: userId, recruiter_id: recruiterId },
        body: { is_vip: true, vip_start_at: "2024-01-01", vip_end_at: "2025-01-01" },
      });
      commandHandler.updateRecruiterVip.mockResolvedValue(
        wrapper.data({ id: recruiterId, is_vip: true })
      );

      await apiHandler.updateRecruiterVipSelf(req, res);

      expect(commandHandler.updateRecruiterVip).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          id: recruiterId,
          is_vip: true,
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error when is_vip missing", async () => {
      const req = createMockRequest({
        userMeta: { id: userId, recruiter_id: recruiterId },
        body: {},
      });

      await apiHandler.updateRecruiterVipSelf(req, res);

      expect(commandHandler.updateRecruiterVip).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
