jest.mock("../../../src/modules/locations/repositories/queries/query_handler", () => ({
  getAllProvinces: jest.fn(),
  getProvinceById: jest.fn(),
  getAllCities: jest.fn(),
  getCityById: jest.fn(),
  searchLocations: jest.fn(),
}));

const queryHandler = require("../../../src/modules/locations/repositories/queries/query_handler");
const apiHandler = require("../../../src/modules/locations/handlers/api_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("Locations API Handler", () => {
  let res;

  beforeEach(() => {
    res = createMockResponse();
    jest.clearAllMocks();
  });

  describe("getAllProvinces", () => {
    it("should return provinces", async () => {
      const req = createMockRequest();
      const provinces = [{ id: 1, name: "DKI Jakarta" }];
      queryHandler.getAllProvinces.mockResolvedValue(wrapper.data(provinces));

      await apiHandler.getAllProvinces(req, res);

      expect(queryHandler.getAllProvinces).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getProvinceById", () => {
    it("should return province by id", async () => {
      const req = createMockRequest({ params: { id: "1" } });
      const province = { id: 1, name: "DKI Jakarta" };
      queryHandler.getProvinceById.mockResolvedValue(wrapper.data(province));

      await apiHandler.getProvinceById(req, res);

      expect(queryHandler.getProvinceById).toHaveBeenCalledWith({ id: "1" });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getAllCities", () => {
    it("should return cities with optional province_id", async () => {
      const req = createMockRequest({ query: { province_id: "32" } });
      const cities = [{ id: 1, name: "Bandung" }];
      queryHandler.getAllCities.mockResolvedValue(wrapper.data(cities));

      await apiHandler.getAllCities(req, res);

      expect(queryHandler.getAllCities).toHaveBeenCalledWith({ province_id: "32" });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getCityById", () => {
    it("should return city by id", async () => {
      const req = createMockRequest({ params: { id: "1" } });
      const city = { id: 1, name: "Jakarta Selatan" };
      queryHandler.getCityById.mockResolvedValue(wrapper.data(city));

      await apiHandler.getCityById(req, res);

      expect(queryHandler.getCityById).toHaveBeenCalledWith({ id: "1" });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("searchLocations", () => {
    it("should search locations with query params", async () => {
      const req = createMockRequest({
        query: { search: "jakarta", type: "all", province_id: "31" },
      });
      const results = { provinces: [], cities: [{ id: 1, name: "Jakarta" }] };
      queryHandler.searchLocations.mockResolvedValue(wrapper.data(results));

      await apiHandler.searchLocations(req, res);

      expect(queryHandler.searchLocations).toHaveBeenCalledWith({
        search: "jakarta",
        type: "all",
        province_id: "31",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should default type to all when not provided", async () => {
      const req = createMockRequest({ query: { search: "jakarta" } });
      queryHandler.searchLocations.mockResolvedValue(wrapper.data({ provinces: [], cities: [] }));

      await apiHandler.searchLocations(req, res);

      expect(queryHandler.searchLocations).toHaveBeenCalledWith({
        search: "jakarta",
        type: "all",
        province_id: undefined,
      });
    });
  });

  describe("searchCitiesByProvince", () => {
    it("should search cities within province", async () => {
      const req = createMockRequest({
        params: { province_id: "32" },
        query: { search: "bandung" },
      });
      queryHandler.searchLocations.mockResolvedValue(wrapper.data({ cities: [] }));

      await apiHandler.searchCitiesByProvince(req, res);

      expect(queryHandler.searchLocations).toHaveBeenCalledWith({
        search: "bandung",
        type: "cities",
        province_id: "32",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
