jest.mock("../../../src/modules/experience_levels/repositories/queries/query_handler", () => ({
  getExperienceLevel: jest.fn(),
  getAllExperienceLevels: jest.fn(),
}));

jest.mock("../../../src/modules/experience_levels/repositories/commands/command_handler", () => ({
  addExperienceLevel: jest.fn(),
  updateExperienceLevel: jest.fn(),
  deleteExperienceLevel: jest.fn(),
}));

const queryHandler = require("../../../src/modules/experience_levels/repositories/queries/query_handler");
const commandHandler = require("../../../src/modules/experience_levels/repositories/commands/command_handler");
const apiHandler = require("../../../src/modules/experience_levels/handlers/api_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("Experience Levels API Handler", () => {
  let res;

  beforeEach(() => {
    res = createMockResponse();
    jest.clearAllMocks();
  });

  describe("getExperienceLevel", () => {
    it("should return experience level on valid request", async () => {
      const req = createMockRequest({ params: { id: "1" } });
      queryHandler.getExperienceLevel.mockResolvedValue(wrapper.data({ id: 1, name: "Senior" }));

      await apiHandler.getExperienceLevel(req, res);

      expect(queryHandler.getExperienceLevel).toHaveBeenCalledWith({ id: 1 });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error for invalid id", async () => {
      const req = createMockRequest({ params: { id: "invalid" } });

      await apiHandler.getExperienceLevel(req, res);

      expect(queryHandler.getExperienceLevel).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getAllExperienceLevels", () => {
    it("should return paginated experience levels", async () => {
      const req = createMockRequest({ query: { page: "1", limit: "10" } });
      const items = [{ id: 1, name: "Senior" }];
      const meta = { page: 1, per_page: 10, total_data: 1, total_pages: 1 };
      queryHandler.getAllExperienceLevels.mockResolvedValue(wrapper.paginationData(items, meta));

      await apiHandler.getAllExperienceLevels(req, res);

      expect(queryHandler.getAllExperienceLevels).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("addExperienceLevel", () => {
    it("should create experience level on valid request", async () => {
      const req = createMockRequest({ body: { name: "Senior" } });
      commandHandler.addExperienceLevel.mockResolvedValue(wrapper.data({ id: 1 }));

      await apiHandler.addExperienceLevel(req, res);

      expect(commandHandler.addExperienceLevel).toHaveBeenCalledWith({ name: "Senior" });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error when name is missing", async () => {
      const req = createMockRequest({ body: {} });

      await apiHandler.addExperienceLevel(req, res);

      expect(commandHandler.addExperienceLevel).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("updateExperienceLevel", () => {
    it("should update experience level on valid request", async () => {
      const req = createMockRequest({ params: { id: "1" }, body: { name: "Junior" } });
      commandHandler.updateExperienceLevel.mockResolvedValue(wrapper.data({ id: 1 }));

      await apiHandler.updateExperienceLevel(req, res);

      expect(commandHandler.updateExperienceLevel).toHaveBeenCalledWith({ id: 1, name: "Junior" });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deleteExperienceLevel", () => {
    it("should delete experience level on valid request", async () => {
      const req = createMockRequest({ params: { id: "1" } });
      commandHandler.deleteExperienceLevel.mockResolvedValue(wrapper.data("Success deleted Experience Level"));

      await apiHandler.deleteExperienceLevel(req, res);

      expect(commandHandler.deleteExperienceLevel).toHaveBeenCalledWith({ id: 1 });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
