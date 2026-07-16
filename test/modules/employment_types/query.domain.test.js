const EmploymentTypesQueryDomain = require("../../../src/modules/employment_types/repositories/queries/domain");
const { NotFoundError } = require("../../../src/helpers/errors");

describe("Employment Types Query Domain", () => {
  let domain;
  let mockQuery;

  beforeEach(() => {
    domain = new EmploymentTypesQueryDomain({});
    mockQuery = {
      findOne: jest.fn(),
      findAllEmploymentTypes: jest.fn(),
      countAllEmploymentTypes: jest.fn(),
    };
    domain.query = mockQuery;
  });

  const mockCountResult = (total) => ({
    err: null,
    data: { rows: [{ total: String(total) }] },
  });

  describe("getOneEmploymentType", () => {
    it("should return employment type when found", async () => {
      const data = { id: 1, name: "Full Time" };
      mockQuery.findOne.mockResolvedValue({ err: null, data });

      const result = await domain.getOneEmploymentType({ id: 1 });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(data);
      expect(mockQuery.findOne).toHaveBeenCalledWith({ id: 1 }, { id: 1, name: 1 });
    });

    it("should return NotFoundError when not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.getOneEmploymentType({ id: 999 });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Can not find EmploymentType");
    });
  });

  describe("getAllEmploymentTypes", () => {
    const payload = { page: 1, limit: 10, search: "full" };

    it("should return paginated employment types when found", async () => {
      const items = [{ id: 1, name: "Full Time" }];
      mockQuery.findAllEmploymentTypes.mockResolvedValue({ err: null, data: items });
      mockQuery.countAllEmploymentTypes.mockResolvedValue(mockCountResult(25));

      const result = await domain.getAllEmploymentTypes(payload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual(items);
      expect(result.meta).toEqual({
        page: 1,
        per_page: 10,
        total_data: 25,
        total_pages: 3,
      });
    });

    it("should return NotFoundError when query fails", async () => {
      mockQuery.findAllEmploymentTypes.mockResolvedValue({ err: new Error("db error"), data: null });
      mockQuery.countAllEmploymentTypes.mockResolvedValue(mockCountResult(0));

      const result = await domain.getAllEmploymentTypes(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Can not find EmploymentTypes");
    });

    it("should leave total_pages undefined when limit is not provided", async () => {
      mockQuery.findAllEmploymentTypes.mockResolvedValue({ err: null, data: [{ id: 1 }] });
      mockQuery.countAllEmploymentTypes.mockResolvedValue(mockCountResult(5));

      const result = await domain.getAllEmploymentTypes({ page: 1, search: "" });

      expect(result.meta.total_data).toBe(5);
      expect(result.meta.total_pages).toBeUndefined();
    });
  });
});
