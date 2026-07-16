const GendersQueryDomain = require("../../../src/modules/genders/repositories/queries/domain");
const { NotFoundError } = require("../../../src/helpers/errors");

describe("Genders Query Domain", () => {
  let domain;
  let mockQuery;

  beforeEach(() => {
    domain = new GendersQueryDomain({});
    mockQuery = {
      findOne: jest.fn(),
      findAllGenders: jest.fn(),
      countAllGenders: jest.fn(),
    };
    domain.query = mockQuery;
  });

  describe("getOneGender", () => {
    it("should return gender when found", async () => {
      const data = { id: 1, gender_name: "Male" };
      mockQuery.findOne.mockResolvedValue({ err: null, data });

      const result = await domain.getOneGender({ id: 1 });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(data);
      expect(mockQuery.findOne).toHaveBeenCalledWith({ id: 1 }, { id: 1, gender_name: 1 });
    });

    it("should return NotFoundError when not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.getOneGender({ id: 999 });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Can not find Gender");
    });
  });

  describe("getAllGenders", () => {
    const payload = { page: 1, limit: 10, search: "male" };

    it("should return paginated genders when found", async () => {
      const items = [{ id: 1, gender_name: "Male" }];
      mockQuery.findAllGenders.mockResolvedValue({ err: null, data: items });
      mockQuery.countAllGenders.mockResolvedValue({ err: null, data: 20 });

      const result = await domain.getAllGenders(payload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual(items);
      expect(result.meta).toEqual({
        page: 1,
        per_page: 10,
        total_data: 20,
        total_pages: 2,
      });
    });

    it("should return NotFoundError when query fails", async () => {
      mockQuery.findAllGenders.mockResolvedValue({ err: new Error("db error"), data: null });
      mockQuery.countAllGenders.mockResolvedValue({ err: null, data: 0 });

      const result = await domain.getAllGenders(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Can not find genders");
    });

    it("should handle zero total with valid meta", async () => {
      mockQuery.findAllGenders.mockResolvedValue({ err: null, data: [] });
      mockQuery.countAllGenders.mockResolvedValue({ err: null, data: 0 });

      const result = await domain.getAllGenders({ page: 1, limit: 10, search: "" });

      expect(result.meta.total_data).toBe(0);
      expect(result.meta.total_pages).toBe(0);
    });
  });
});
