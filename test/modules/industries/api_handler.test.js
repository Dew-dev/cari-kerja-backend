jest.mock("../../../src/modules/industries/repositories/queries/query_handler", () => ({
  getIndustry: jest.fn(),
  getAllIndustries: jest.fn(),
}));

jest.mock("../../../src/modules/industries/repositories/commands/command_handler", () => ({
  addIndustry: jest.fn(),
  updateIndustry: jest.fn(),
  deleteIndustry: jest.fn(),
}));

const queryHandler = require("../../../src/modules/industries/repositories/queries/query_handler");
const commandHandler = require("../../../src/modules/industries/repositories/commands/command_handler");
const apiHandler = require("../../../src/modules/industries/handlers/api_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("Industries API Handler", () => {
  let res;

  beforeEach(() => {
    res = createMockResponse();
    jest.clearAllMocks();
  });

  describe("getIndustry", () => {
    it("should return industry on valid request", async () => {
      const req = createMockRequest({ params: { id: "1" } });
      queryHandler.getIndustry.mockResolvedValue(wrapper.data({ id: 1, name: "Technology" }));

      await apiHandler.getIndustry(req, res);

      expect(queryHandler.getIndustry).toHaveBeenCalledWith({ id: 1 });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error for invalid id", async () => {
      const req = createMockRequest({ params: { id: "invalid" } });

      await apiHandler.getIndustry(req, res);

      expect(queryHandler.getIndustry).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getAllIndustries", () => {
    it("should return paginated industries", async () => {
      const req = createMockRequest({ query: { page: "1", limit: "10", search: "tech" } });
      const items = [{ id: 1, name: "Technology" }];
      const meta = { page: 1, per_page: 10, total_data: 1, total_pages: 1 };
      queryHandler.getAllIndustries.mockResolvedValue(wrapper.paginationData(items, meta));

      await apiHandler.getAllIndustries(req, res);

      expect(queryHandler.getAllIndustries).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: "tech",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("addIndustry", () => {
    it("should create industry on valid request", async () => {
      const req = createMockRequest({ body: { name: "Technology" } });
      commandHandler.addIndustry.mockResolvedValue(wrapper.data({ id: 1 }));

      await apiHandler.addIndustry(req, res);

      expect(commandHandler.addIndustry).toHaveBeenCalledWith({ name: "Technology" });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error when name is missing", async () => {
      const req = createMockRequest({ body: {} });

      await apiHandler.addIndustry(req, res);

      expect(commandHandler.addIndustry).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("updateIndustry", () => {
    it("should update industry on valid request", async () => {
      const req = createMockRequest({ params: { id: "1" }, body: { name: "Finance" } });
      commandHandler.updateIndustry.mockResolvedValue(wrapper.data({ id: 1 }));

      await apiHandler.updateIndustry(req, res);

      expect(commandHandler.updateIndustry).toHaveBeenCalledWith({ id: 1, name: "Finance" });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deleteIndustry", () => {
    it("should delete industry on valid request", async () => {
      const req = createMockRequest({ params: { id: "1" } });
      commandHandler.deleteIndustry.mockResolvedValue(wrapper.data("Success deleted industry"));

      await apiHandler.deleteIndustry(req, res);

      expect(commandHandler.deleteIndustry).toHaveBeenCalledWith({ id: 1 });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
