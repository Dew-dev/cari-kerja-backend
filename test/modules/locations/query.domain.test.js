const LocationsQueryDomain = require("../../../src/modules/locations/repositories/queries/domain");
const { NotFoundError } = require("../../../src/helpers/errors");

describe("Locations Query Domain", () => {
  let domain;
  let mockQuery;

  beforeEach(() => {
    domain = new LocationsQueryDomain({});
    mockQuery = {
      getAllProvinces: jest.fn(),
      getProvinceById: jest.fn(),
      getAllCities: jest.fn(),
      getCitiesByProvinceId: jest.fn(),
      getCityById: jest.fn(),
      searchProvinces: jest.fn(),
      searchCities: jest.fn(),
    };
    domain.query = mockQuery;
  });

  describe("getAllProvinces", () => {
    it("should return provinces when found", async () => {
      const provinces = [{ id: 1, name: "DKI Jakarta" }];
      mockQuery.getAllProvinces.mockResolvedValue({ err: null, data: provinces });

      const result = await domain.getAllProvinces();

      expect(result.err).toBeNull();
      expect(result.data).toEqual(provinces);
    });

    it("should return NotFoundError when query fails", async () => {
      mockQuery.getAllProvinces.mockResolvedValue({ err: new Error("db error"), data: null });

      const result = await domain.getAllProvinces();

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Cannot find provinces");
    });
  });

  describe("getProvinceById", () => {
    it("should return province when found", async () => {
      const province = { id: 1, name: "DKI Jakarta" };
      mockQuery.getProvinceById.mockResolvedValue({ err: null, data: province });

      const result = await domain.getProvinceById({ id: 1 });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(province);
      expect(mockQuery.getProvinceById).toHaveBeenCalledWith(1);
    });

    it("should return NotFoundError when province not found", async () => {
      mockQuery.getProvinceById.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.getProvinceById({ id: 999 });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Province not found");
    });
  });

  describe("getAllCities", () => {
    it("should return all cities when province_id is not provided", async () => {
      const cities = [{ id: 1, name: "Jakarta Selatan" }];
      mockQuery.getAllCities.mockResolvedValue({ err: null, data: cities });

      const result = await domain.getAllCities({});

      expect(result.err).toBeNull();
      expect(result.data).toEqual(cities);
      expect(mockQuery.getAllCities).toHaveBeenCalled();
      expect(mockQuery.getCitiesByProvinceId).not.toHaveBeenCalled();
    });

    it("should return cities by province when province_id is provided", async () => {
      const cities = [{ id: 1, name: "Bandung" }];
      mockQuery.getCitiesByProvinceId.mockResolvedValue({ err: null, data: cities });

      const result = await domain.getAllCities({ province_id: 32 });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(cities);
      expect(mockQuery.getCitiesByProvinceId).toHaveBeenCalledWith(32);
    });

    it("should return NotFoundError when query fails", async () => {
      mockQuery.getAllCities.mockResolvedValue({ err: new Error("db error"), data: null });

      const result = await domain.getAllCities({});

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Cannot find cities");
    });
  });

  describe("getCityById", () => {
    it("should return city when found", async () => {
      const city = { id: 1, name: "Jakarta Selatan" };
      mockQuery.getCityById.mockResolvedValue({ err: null, data: city });

      const result = await domain.getCityById({ id: 1 });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(city);
    });

    it("should return NotFoundError when city not found", async () => {
      mockQuery.getCityById.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.getCityById({ id: 999 });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("City not found");
    });
  });

  describe("searchLocations", () => {
    it("should return NotFoundError when search term is empty", async () => {
      const result = await domain.searchLocations({ search: "   " });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Search term is required");
    });

    it("should search provinces and cities when type is all", async () => {
      mockQuery.searchProvinces.mockResolvedValue({
        err: null,
        data: [{ id: 1, name: "Jakarta" }],
      });
      mockQuery.searchCities.mockResolvedValue({
        err: null,
        data: [{ id: 2, name: "Jakarta Selatan" }],
      });

      const result = await domain.searchLocations({ search: "jakarta", type: "all" });

      expect(result.err).toBeNull();
      expect(result.data).toEqual({
        provinces: [{ id: 1, name: "Jakarta" }],
        cities: [{ id: 2, name: "Jakarta Selatan" }],
      });
    });

    it("should search only provinces when type is provinces", async () => {
      mockQuery.searchProvinces.mockResolvedValue({
        err: null,
        data: [{ id: 1, name: "Jakarta" }],
      });

      const result = await domain.searchLocations({ search: "jakarta", type: "provinces" });

      expect(result.err).toBeNull();
      expect(result.data).toEqual({
        provinces: [{ id: 1, name: "Jakarta" }],
      });
      expect(mockQuery.searchCities).not.toHaveBeenCalled();
    });

    it("should search cities with province_id filter", async () => {
      mockQuery.searchCities.mockResolvedValue({
        err: null,
        data: [{ id: 1, name: "Bandung" }],
      });

      const result = await domain.searchLocations({
        search: "bandung",
        type: "cities",
        province_id: 32,
      });

      expect(result.err).toBeNull();
      expect(result.data).toEqual({
        cities: [{ id: 1, name: "Bandung" }],
      });
      expect(mockQuery.searchCities).toHaveBeenCalledWith("bandung", 32);
    });

    it("should return empty arrays when search queries fail", async () => {
      mockQuery.searchProvinces.mockResolvedValue({ err: new Error("fail"), data: null });
      mockQuery.searchCities.mockResolvedValue({ err: new Error("fail"), data: null });

      const result = await domain.searchLocations({ search: "test", type: "all" });

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ provinces: [], cities: [] });
    });
  });
});
