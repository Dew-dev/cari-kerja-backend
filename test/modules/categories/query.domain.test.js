const CategoriesQueryDomain = require("../../../src/modules/categories/repositories/queries/domain");
const { NotFoundError } = require("../../../src/helpers/errors");

describe("Categories Query Domain", () => {
  let domain;
  let mockQuery;

  beforeEach(() => {
    domain = new CategoriesQueryDomain({});
    mockQuery = {
      findOneResolved: jest.fn(),
      listTranslations: jest.fn(),
      findAllCategories: jest.fn(),
      countAllCategories: jest.fn(),
      findAllCategoriesWithJobcount: jest.fn(),
    };
    domain.query = mockQuery;
  });

  describe("getOneCategory", () => {
    it("should return category data when found", async () => {
      const categoryData = {
        id: 1,
        name: "Technology",
        created_at: "2024-01-01",
        locale: "id",
        locale_resolved: "id",
      };
      mockQuery.findOneResolved.mockResolvedValue(categoryData);

      const result = await domain.getOneCategory({ id: 1 });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(categoryData);
      expect(mockQuery.findOneResolved).toHaveBeenCalledWith(1, "id");
    });

    it("should return NotFoundError when category not found", async () => {
      mockQuery.findOneResolved.mockResolvedValue(null);

      const result = await domain.getOneCategory({ id: 999 });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Can not find Category");
      expect(result.data).toBeNull();
    });
  });

  describe("getAllCategories", () => {
    const payload = { page: 1, limit: 10, search: "tech" };

    it("should return paginated categories when found", async () => {
      const categories = [{ id: 1, name: "Technology" }];
      mockQuery.findAllCategories.mockResolvedValue({ err: null, data: categories });
      mockQuery.countAllCategories.mockResolvedValue({ err: null, data: 25 });

      const result = await domain.getAllCategories(payload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual(categories);
      expect(result.meta).toEqual({
        page: 1,
        per_page: 10,
        total_data: 25,
        total_pages: 3,
      });
      expect(mockQuery.findAllCategories).toHaveBeenCalledWith(1, 10, "tech", "id");
      expect(mockQuery.countAllCategories).toHaveBeenCalledWith("tech", "id");
    });

    it("should return NotFoundError when query fails", async () => {
      mockQuery.findAllCategories.mockResolvedValue({ err: new Error("db error"), data: null });
      mockQuery.countAllCategories.mockResolvedValue({ err: null, data: 0 });

      const result = await domain.getAllCategories(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Can not find categories");
    });

    it("should never return null meta values when count data is invalid", async () => {
      mockQuery.findAllCategories.mockResolvedValue({
        err: null,
        data: [{ id: 1, name: "Tech" }],
      });
      mockQuery.countAllCategories.mockResolvedValue({ err: null, data: null });

      const result = await domain.getAllCategories({ page: 1, limit: 10, search: "" });

      expect(result.meta.total_data).toBe(0);
      expect(result.meta.total_pages).toBe(0);
      expect(result.meta.total_data).not.toBeNull();
      expect(result.meta.total_pages).not.toBeNull();
    });

    it("should return InternalServerError when count query fails", async () => {
      mockQuery.findAllCategories.mockResolvedValue({ err: null, data: [{ id: 1 }] });
      mockQuery.countAllCategories.mockResolvedValue({
        err: new Error("count failed"),
        data: null,
      });

      const result = await domain.getAllCategories(payload);

      expect(result.err).toBeInstanceOf(
        require("../../../src/helpers/errors").InternalServerError
      );
      expect(result.err.message).toBe("Can not count categories");
    });
  });

  describe("getAllCategoriesWithJobcount", () => {
    it("should return categories with job count when found", async () => {
      const categories = [{ id: 1, name: "Technology", job_count: 5 }];
      mockQuery.findAllCategoriesWithJobcount.mockResolvedValue({
        err: null,
        data: categories,
      });

      const result = await domain.getAllCategoriesWithJobcount();

      expect(result.err).toBeNull();
      expect(result.data).toEqual(categories);
      expect(mockQuery.findAllCategoriesWithJobcount).toHaveBeenCalledWith("id");
    });

    it("should return NotFoundError when query fails", async () => {
      mockQuery.findAllCategoriesWithJobcount.mockResolvedValue({
        err: new Error("db error"),
        data: null,
      });

      const result = await domain.getAllCategoriesWithJobcount();

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Can not find categories");
    });
  });
});
