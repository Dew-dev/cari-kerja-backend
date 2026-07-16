const IndustriesQueryDomain = require("../../../src/modules/industries/repositories/queries/domain");
const { NotFoundError } = require("../../../src/helpers/errors");

describe("Industries Query Domain", () => {
  let domain;
  let mockQuery;

  beforeEach(() => {
    domain = new IndustriesQueryDomain({});
    mockQuery = {
      findOne: jest.fn(),
      findAllIndustries: jest.fn(),
      countAllIndustries: jest.fn(),
    };
    domain.query = mockQuery;
  });

  describe("getOneIndustry", () => {
    it("should return industry when found", async () => {
      const data = { id: 1, name: "Technology", created_at: "2024-01-01" };
      mockQuery.findOne.mockResolvedValue({ err: null, data });

      const result = await domain.getOneIndustry({ id: 1 });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(data);
      expect(mockQuery.findOne).toHaveBeenCalledWith(
        { id: 1 },
        { id: 1, name: 1, created_at: 1 }
      );
    });

    it("should return NotFoundError when not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.getOneIndustry({ id: 999 });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Can not find Industry");
    });
  });

  describe("getAllIndustries", () => {
    const payload = { page: 1, limit: 10, search: "tech" };

    it("should return paginated industries when found", async () => {
      const items = [{ id: 1, name: "Technology" }];
      mockQuery.findAllIndustries.mockResolvedValue({ err: null, data: items });
      mockQuery.countAllIndustries.mockResolvedValue({ err: null, data: 30 });

      const result = await domain.getAllIndustries(payload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual(items);
      expect(result.meta).toEqual({
        page: 1,
        per_page: 10,
        total_data: 30,
        total_pages: 3,
      });
    });

    it("should return NotFoundError when query fails", async () => {
      mockQuery.findAllIndustries.mockResolvedValue({ err: new Error("db error"), data: null });
      mockQuery.countAllIndustries.mockResolvedValue({ err: null, data: 0 });

      const result = await domain.getAllIndustries(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Can not find industries");
    });

    it("should handle zero total with valid meta", async () => {
      mockQuery.findAllIndustries.mockResolvedValue({ err: null, data: [] });
      mockQuery.countAllIndustries.mockResolvedValue({ err: null, data: 0 });

      const result = await domain.getAllIndustries({ page: 1, limit: 10, search: "" });

      expect(result.meta.total_data).toBe(0);
      expect(result.meta.total_pages).toBe(0);
    });
  });
});
