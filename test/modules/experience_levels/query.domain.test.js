const ExperienceLevelsQueryDomain = require("../../../src/modules/experience_levels/repositories/queries/domain");
const { NotFoundError } = require("../../../src/helpers/errors");

describe("Experience Levels Query Domain", () => {
  let domain;
  let mockQuery;

  beforeEach(() => {
    domain = new ExperienceLevelsQueryDomain({});
    mockQuery = {
      findOne: jest.fn(),
      findAllExperienceLevels: jest.fn(),
      countAllExperienceLevels: jest.fn(),
    };
    domain.query = mockQuery;
  });

  const mockCountResult = (total) => ({
    err: null,
    data: { rows: [{ total: String(total) }] },
  });

  describe("getOneExperienceLevel", () => {
    it("should return experience level when found", async () => {
      const data = { id: 1, name: "Senior" };
      mockQuery.findOne.mockResolvedValue({ err: null, data });

      const result = await domain.getOneExperienceLevel({ id: 1 });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(data);
    });

    it("should return NotFoundError when not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.getOneExperienceLevel({ id: 999 });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Can not find ExperienceLevel");
    });
  });

  describe("getAllExperienceLevels", () => {
    const payload = { page: 1, limit: 10, search: "sen" };

    it("should return paginated experience levels when found", async () => {
      const items = [{ id: 1, name: "Senior" }];
      mockQuery.findAllExperienceLevels.mockResolvedValue({ err: null, data: items });
      mockQuery.countAllExperienceLevels.mockResolvedValue(mockCountResult(15));

      const result = await domain.getAllExperienceLevels(payload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual(items);
      expect(result.meta).toEqual({
        page: 1,
        per_page: 10,
        total_data: 15,
        total_pages: 2,
      });
    });

    it("should return NotFoundError when query fails", async () => {
      mockQuery.findAllExperienceLevels.mockResolvedValue({ err: new Error("db error"), data: null });
      mockQuery.countAllExperienceLevels.mockResolvedValue(mockCountResult(0));

      const result = await domain.getAllExperienceLevels(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Can not find ExperienceLevels");
    });

    it("should default pagination meta when limit is not provided", async () => {
      mockQuery.findAllExperienceLevels.mockResolvedValue({ err: null, data: [{ id: 1 }] });
      mockQuery.countAllExperienceLevels.mockResolvedValue(mockCountResult(8));

      const result = await domain.getAllExperienceLevels({ page: 1, search: "" });

      expect(result.meta.total_data).toBe(8);
      expect(result.meta.per_page).toBe(10);
      expect(Number.isFinite(result.meta.total_pages)).toBe(true);
    });
  });
});
