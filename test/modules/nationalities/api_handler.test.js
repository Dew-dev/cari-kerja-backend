jest.mock("../../../src/modules/nationalities/repositories/commands/command_handler", () => ({
  addNationality: jest.fn(),
  updateNationality: jest.fn(),
  deleteNationality: jest.fn(),
}));

jest.mock("../../../src/modules/nationalities/repositories/queries/query_handler", () => ({
  getNationality: jest.fn(),
  getAllNationalities: jest.fn(),
}));

const commandHandler = require("../../../src/modules/nationalities/repositories/commands/command_handler");
const queryHandler = require("../../../src/modules/nationalities/repositories/queries/query_handler");
const apiHandler = require("../../../src/modules/nationalities/handlers/api_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("Nationalities API Handler", () => {
  let res;

  beforeEach(() => {
    res = createMockResponse();
    jest.clearAllMocks();
  });

  describe("getNationality", () => {
    it("should return nationality on valid request", async () => {
      const req = createMockRequest({ params: { id: "1" } });
      const nationality = { id: 1, country_name: "Indonesia" };
      queryHandler.getNationality.mockResolvedValue(wrapper.data(nationality));

      await apiHandler.getNationality(req, res);

      expect(queryHandler.getNationality).toHaveBeenCalledWith({ id: 1 });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error for invalid id", async () => {
      const req = createMockRequest({ params: { id: "invalid" } });

      await apiHandler.getNationality(req, res);

      expect(queryHandler.getNationality).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getAllNationalities", () => {
    it("should return paginated nationalities", async () => {
      const req = createMockRequest({ query: { page: "1", limit: "10", search: "indo" } });
      const nationalities = [{ id: 1, country_name: "Indonesia" }];
      queryHandler.getAllNationalities.mockResolvedValue(
        wrapper.paginationData(nationalities, {
          page: 1,
          per_page: 10,
          total_data: 1,
          total_pages: 1,
        })
      );

      await apiHandler.getAllNationalities(req, res);

      expect(queryHandler.getAllNationalities).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: "indo",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("addNationality", () => {
    const validBody = {
      country_name: "Indonesia",
      iso_alpha2: "ID",
      iso_alpha3: "IDN",
    };

    it("should add nationality on valid request", async () => {
      const req = createMockRequest({ body: validBody });
      commandHandler.addNationality.mockResolvedValue(wrapper.data({ id: 1 }));

      await apiHandler.addNationality(req, res);

      expect(commandHandler.addNationality).toHaveBeenCalledWith(validBody);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error when required fields missing", async () => {
      const req = createMockRequest({ body: { country_name: "Indonesia" } });

      await apiHandler.addNationality(req, res);

      expect(commandHandler.addNationality).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("updateNationality", () => {
    it("should update nationality on valid request", async () => {
      const req = createMockRequest({
        params: { id: "1" },
        body: { country_name: "Indonesia Updated" },
      });
      commandHandler.updateNationality.mockResolvedValue(wrapper.data({ id: 1 }));

      await apiHandler.updateNationality(req, res);

      expect(commandHandler.updateNationality).toHaveBeenCalledWith({
        id: 1,
        country_name: "Indonesia Updated",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deleteNationality", () => {
    it("should delete nationality on valid request", async () => {
      const req = createMockRequest({ params: { id: "1" } });
      commandHandler.deleteNationality.mockResolvedValue(
        wrapper.data("Success deleted nationality")
      );

      await apiHandler.deleteNationality(req, res);

      expect(commandHandler.deleteNationality).toHaveBeenCalledWith({ id: 1 });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
