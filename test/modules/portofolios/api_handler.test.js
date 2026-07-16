jest.mock("../../../src/modules/portofolios/repositories/commands/command_handler", () => ({
  insertPortfolios: jest.fn(),
  updatePortfolios: jest.fn(),
  deletePortfolios: jest.fn(),
}));

jest.mock("../../../src/modules/portofolios/repositories/queries/query_handler", () => ({
  getAllPortfoliosByWorkerId: jest.fn(),
}));

const commandHandler = require("../../../src/modules/portofolios/repositories/commands/command_handler");
const queryHandler = require("../../../src/modules/portofolios/repositories/queries/query_handler");
const apiHandler = require("../../../src/modules/portofolios/handler/api_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("Portofolios API Handler", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";
  const portfolioId = "550e8400-e29b-41d4-a716-446655440001";
  let res;

  beforeEach(() => {
    res = createMockResponse();
    jest.clearAllMocks();
  });

  const createWorkerRequest = (overrides = {}) =>
    createMockRequest({
      userMeta: { worker_id: workerId },
      ...overrides,
    });

  describe("getAllPortfolios", () => {
    it("should return portofolios on valid request", async () => {
      const req = createWorkerRequest();
      const portfolios = [{ id: portfolioId, title: "My Project" }];
      queryHandler.getAllPortfoliosByWorkerId.mockResolvedValue(wrapper.data(portfolios));

      await apiHandler.getAllPortfolios(req, res);

      expect(queryHandler.getAllPortfoliosByWorkerId).toHaveBeenCalledWith({
        worker_id: workerId,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("insertPortfolios", () => {
    const validBody = {
      title: "My Portfolio",
      link: "https://example.com",
      is_public: true,
    };

    it("should insert portofolio on valid request", async () => {
      const req = createWorkerRequest({ body: validBody });
      commandHandler.insertPortfolios.mockResolvedValue(
        wrapper.data({ id: portfolioId })
      );

      await apiHandler.insertPortfolios(req, res);

      expect(commandHandler.insertPortfolios).toHaveBeenCalledWith({
        worker_id: workerId,
        ...validBody,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error when required fields missing", async () => {
      const req = createWorkerRequest({ body: { title: "My Portfolio" } });

      await apiHandler.insertPortfolios(req, res);

      expect(commandHandler.insertPortfolios).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("updatePortfolios", () => {
    const validBody = {
      title: "Updated Portfolio",
      link: "https://updated.com",
      is_public: false,
    };

    it("should update portofolio on valid request", async () => {
      const req = createWorkerRequest({
        params: { id: portfolioId },
        body: validBody,
      });
      commandHandler.updatePortfolios.mockResolvedValue(wrapper.data({ id: portfolioId }));

      await apiHandler.updatePortfolios(req, res);

      expect(commandHandler.updatePortfolios).toHaveBeenCalledWith({
        id: portfolioId,
        worker_id: workerId,
        ...validBody,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deletePortfolios", () => {
    it("should delete portofolio on valid request", async () => {
      const req = createWorkerRequest({ params: { id: portfolioId } });
      commandHandler.deletePortfolios.mockResolvedValue(
        wrapper.data("Successfully deleted")
      );

      await apiHandler.deletePortfolios(req, res);

      expect(commandHandler.deletePortfolios).toHaveBeenCalledWith({
        id: portfolioId,
        worker_id: workerId,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
