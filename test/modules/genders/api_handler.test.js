jest.mock("../../../src/modules/genders/repositories/queries/query_handler", () => ({
  getGender: jest.fn(),
  getAllGenders: jest.fn(),
}));

jest.mock("../../../src/modules/genders/repositories/commands/command_handler", () => ({
  addGender: jest.fn(),
  updateGender: jest.fn(),
  deleteGender: jest.fn(),
}));

const queryHandler = require("../../../src/modules/genders/repositories/queries/query_handler");
const commandHandler = require("../../../src/modules/genders/repositories/commands/command_handler");
const apiHandler = require("../../../src/modules/genders/handlers/api_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("Genders API Handler", () => {
  let res;

  beforeEach(() => {
    res = createMockResponse();
    jest.clearAllMocks();
  });

  describe("getGender", () => {
    it("should return gender on valid request", async () => {
      const req = createMockRequest({ params: { id: "1" } });
      queryHandler.getGender.mockResolvedValue(wrapper.data({ id: 1, gender_name: "Male" }));

      await apiHandler.getGender(req, res);

      expect(queryHandler.getGender).toHaveBeenCalledWith({ id: 1 });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error for invalid id", async () => {
      const req = createMockRequest({ params: { id: "invalid" } });

      await apiHandler.getGender(req, res);

      expect(queryHandler.getGender).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getAllGenders", () => {
    it("should return paginated genders", async () => {
      const req = createMockRequest({ query: { page: "1", limit: "10", search: "male" } });
      const items = [{ id: 1, gender_name: "Male" }];
      const meta = { page: 1, per_page: 10, total_data: 1, total_pages: 1 };
      queryHandler.getAllGenders.mockResolvedValue(wrapper.paginationData(items, meta));

      await apiHandler.getAllGenders(req, res);

      expect(queryHandler.getAllGenders).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: "male",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("addGender", () => {
    it("should create gender on valid request", async () => {
      const req = createMockRequest({ body: { gender_name: "Male" } });
      commandHandler.addGender.mockResolvedValue(wrapper.data({ id: 1 }));

      await apiHandler.addGender(req, res);

      expect(commandHandler.addGender).toHaveBeenCalledWith({ gender_name: "Male" });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error when gender_name is missing", async () => {
      const req = createMockRequest({ body: {} });

      await apiHandler.addGender(req, res);

      expect(commandHandler.addGender).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("updateGender", () => {
    it("should update gender on valid request", async () => {
      const req = createMockRequest({ params: { id: "1" }, body: { gender_name: "Female" } });
      commandHandler.updateGender.mockResolvedValue(wrapper.data({ id: 1 }));

      await apiHandler.updateGender(req, res);

      expect(commandHandler.updateGender).toHaveBeenCalledWith({ id: 1, gender_name: "Female" });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deleteGender", () => {
    it("should delete gender on valid request", async () => {
      const req = createMockRequest({ params: { id: "1" } });
      commandHandler.deleteGender.mockResolvedValue(wrapper.data("Success deleted gender"));

      await apiHandler.deleteGender(req, res);

      expect(commandHandler.deleteGender).toHaveBeenCalledWith({ id: 1 });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
