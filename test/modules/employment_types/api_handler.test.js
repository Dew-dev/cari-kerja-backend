jest.mock("../../../src/modules/employment_types/repositories/queries/query_handler", () => ({
  getEmploymentType: jest.fn(),
  getAllEmploymentTypes: jest.fn(),
}));

jest.mock("../../../src/modules/employment_types/repositories/commands/command_handler", () => ({
  addEmploymentType: jest.fn(),
  updateEmploymentType: jest.fn(),
  deleteEmploymentType: jest.fn(),
}));

const queryHandler = require("../../../src/modules/employment_types/repositories/queries/query_handler");
const commandHandler = require("../../../src/modules/employment_types/repositories/commands/command_handler");
const apiHandler = require("../../../src/modules/employment_types/handlers/api_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("Employment Types API Handler", () => {
  let res;

  beforeEach(() => {
    res = createMockResponse();
    jest.clearAllMocks();
  });

  describe("getEmploymentType", () => {
    it("should return employment type on valid request", async () => {
      const req = createMockRequest({ params: { id: "1" } });
      const data = { id: 1, name: "Full Time" };
      queryHandler.getEmploymentType.mockResolvedValue(wrapper.data(data));

      await apiHandler.getEmploymentType(req, res);

      expect(queryHandler.getEmploymentType).toHaveBeenCalledWith({ id: 1 });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error for invalid id", async () => {
      const req = createMockRequest({ params: { id: "invalid" } });

      await apiHandler.getEmploymentType(req, res);

      expect(queryHandler.getEmploymentType).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getAllEmploymentTypes", () => {
    it("should return paginated employment types", async () => {
      const req = createMockRequest({ query: { page: "1", limit: "10", search: "full" } });
      const items = [{ id: 1, name: "Full Time" }];
      const meta = { page: 1, per_page: 10, total_data: 1, total_pages: 1 };
      queryHandler.getAllEmploymentTypes.mockResolvedValue(wrapper.paginationData(items, meta));

      await apiHandler.getAllEmploymentTypes(req, res);

      expect(queryHandler.getAllEmploymentTypes).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: "full",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("addEmploymentType", () => {
    it("should create employment type on valid request", async () => {
      const req = createMockRequest({ body: { name: "Full Time" } });
      commandHandler.addEmploymentType.mockResolvedValue(wrapper.data({ id: 1 }));

      await apiHandler.addEmploymentType(req, res);

      expect(commandHandler.addEmploymentType).toHaveBeenCalledWith({ name: "Full Time" });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error when name is missing", async () => {
      const req = createMockRequest({ body: {} });

      await apiHandler.addEmploymentType(req, res);

      expect(commandHandler.addEmploymentType).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("updateEmploymentType", () => {
    it("should update employment type on valid request", async () => {
      const req = createMockRequest({ params: { id: "1" }, body: { name: "Part Time" } });
      commandHandler.updateEmploymentType.mockResolvedValue(wrapper.data({ id: 1 }));

      await apiHandler.updateEmploymentType(req, res);

      expect(commandHandler.updateEmploymentType).toHaveBeenCalledWith({ id: 1, name: "Part Time" });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deleteEmploymentType", () => {
    it("should delete employment type on valid request", async () => {
      const req = createMockRequest({ params: { id: "1" } });
      commandHandler.deleteEmploymentType.mockResolvedValue(wrapper.data("Success deleted EmploymentType"));

      await apiHandler.deleteEmploymentType(req, res);

      expect(commandHandler.deleteEmploymentType).toHaveBeenCalledWith({ id: 1 });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
