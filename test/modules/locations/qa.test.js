/**
 * QA Bug-Hunting Tests — locations
 */
const LocationsQueryDomain = require("../../../src/modules/locations/repositories/queries/domain");
const { BadRequestError } = require("../../../src/helpers/errors");

describe("[QA] locations module", () => {
  describe("Query — empty provinces list", () => {
    it("[BUG-LO-001] getAllProvinces should return empty array not NotFoundError", async () => {
      const domain = new LocationsQueryDomain({});
      domain.query = {
        getAllProvinces: jest.fn().mockResolvedValue({
          err: "Data Not Found",
          data: null,
        }),
      };

      const result = await domain.getAllProvinces();

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
    });
  });

  describe("Query — empty cities list", () => {
    it("[BUG-LO-002] getAllCities should return empty array not NotFoundError", async () => {
      const domain = new LocationsQueryDomain({});
      domain.query = {
        getAllCities: jest.fn().mockResolvedValue({
          err: "Data Not Found",
          data: null,
        }),
      };

      const result = await domain.getAllCities({});

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
    });
  });

  describe("Validation — empty search term", () => {
    it("[BUG-LO-003] searchLocations should return BadRequestError for empty search", async () => {
      const domain = new LocationsQueryDomain({});
      domain.query = {
        searchProvinces: jest.fn(),
        searchCities: jest.fn(),
      };

      const result = await domain.searchLocations({ search: "   " });

      expect(result.err).toBeInstanceOf(BadRequestError);
    });
  });

  describe("Query — invalid province id type", () => {
    it("[BUG-LO-004] getProvinceById should reject non-numeric id before query", async () => {
      const domain = new LocationsQueryDomain({});
      domain.query = {
        getProvinceById: jest.fn().mockResolvedValue({
          err: null,
          data: { id: 1, name: "Jakarta" },
        }),
      };

      const result = await domain.getProvinceById({ id: "not-a-number" });

      expect(domain.query.getProvinceById).not.toHaveBeenCalled();
      expect(result.err).toBeTruthy();
    });
  });
});
