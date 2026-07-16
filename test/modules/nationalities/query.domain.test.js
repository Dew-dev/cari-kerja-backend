const NationalitiesQueryDomain = require("../../../src/modules/nationalities/repositories/queries/domain");
const { NotFoundError } = require("../../../src/helpers/errors");

describe("Nationalities Query Domain", () => {
  let domain;
  let mockQuery;

  beforeEach(() => {
    domain = new NationalitiesQueryDomain({});
    mockQuery = {
      findOne: jest.fn(),
      findAllNationalities: jest.fn(),
      countAllNationalities: jest.fn(),
    };
    domain.query = mockQuery;
  });

  describe("getOneNationality", () => {
    it("should return nationality when found", async () => {
      const nationality = { id: 1, country_name: "Indonesia", iso_alpha2: "ID", iso_alpha3: "IDN" };
      mockQuery.findOne.mockResolvedValue({ err: null, data: nationality });

      const result = await domain.getOneNationality({ id: 1 });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(nationality);
      expect(mockQuery.findOne).toHaveBeenCalledWith(
        { id: 1 },
        { id: 1, country_name: 1, iso_alpha2: 1, iso_alpha3: 1 }
      );
    });

    it("should return NotFoundError when nationality not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.getOneNationality({ id: 999 });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Can not find Nationality");
    });
  });

  describe("getAllNationalities", () => {
    const payload = { page: 1, limit: 10, search: "indo" };

    it("should return paginated nationalities when found", async () => {
      const nationalities = [{ id: 1, country_name: "Indonesia" }];
      mockQuery.findAllNationalities.mockResolvedValue({ err: null, data: nationalities });
      mockQuery.countAllNationalities.mockResolvedValue({ err: null, data: 25 });

      const result = await domain.getAllNationalities(payload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual(nationalities);
      expect(result.meta).toEqual({
        page: 1,
        per_page: 10,
        total_data: 25,
        total_pages: 3,
      });
      expect(mockQuery.findAllNationalities).toHaveBeenCalledWith(1, 10, "indo");
      expect(mockQuery.countAllNationalities).toHaveBeenCalledWith("indo");
    });

    it("should return NotFoundError when query fails", async () => {
      mockQuery.findAllNationalities.mockResolvedValue({ err: new Error("db error"), data: null });
      mockQuery.countAllNationalities.mockResolvedValue({ err: null, data: 0 });

      const result = await domain.getAllNationalities(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Can not find nationalities");
    });

    it("should clamp total_data to zero when count is invalid", async () => {
      mockQuery.findAllNationalities.mockResolvedValue({ err: null, data: [{ id: 1 }] });
      mockQuery.countAllNationalities.mockResolvedValue({ err: null, data: null });

      const result = await domain.getAllNationalities({ page: 1, limit: 10, search: "" });

      expect(result.meta.total_data).toBe(0);
      expect(result.meta.total_pages).toBe(0);
    });

    it("should return InternalServerError when count query fails", async () => {
      mockQuery.findAllNationalities.mockResolvedValue({ err: null, data: [{ id: 1 }] });
      mockQuery.countAllNationalities.mockResolvedValue({ err: new Error("count failed"), data: null });

      const result = await domain.getAllNationalities(payload);

      expect(result.err).toBeInstanceOf(require("../../../src/helpers/errors").InternalServerError);
      expect(result.err.message).toBe("Can not count nationalities");
    });
  });
});
