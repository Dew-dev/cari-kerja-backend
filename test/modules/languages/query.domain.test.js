const LanguagesQueryDomain = require("../../../src/modules/languages/repositories/queries/domain");
const { NotFoundError } = require("../../../src/helpers/errors");

describe("Languages Query Domain", () => {
  let domain;
  let mockQuery;

  beforeEach(() => {
    domain = new LanguagesQueryDomain({});
    mockQuery = {
      getAllByWorkerId: jest.fn(),
    };
    domain.query = mockQuery;
  });

  describe("getAllLanguagesByWorkerId", () => {
    const workerId = "550e8400-e29b-41d4-a716-446655440000";

    it("should return languages when found", async () => {
      const languages = [
        { id: "lang-1", language_name: "English", proficiency_level_id: 1 },
      ];
      mockQuery.getAllByWorkerId.mockResolvedValue({ err: null, data: languages });

      const result = await domain.getAllLanguagesByWorkerId({ worker_id: workerId });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(languages);
      expect(mockQuery.getAllByWorkerId).toHaveBeenCalledWith(workerId);
    });

    it("should return NotFoundError when query fails", async () => {
      mockQuery.getAllByWorkerId.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.getAllLanguagesByWorkerId({ worker_id: workerId });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("No languages found");
    });

    it("should return empty array when worker has no languages", async () => {
      mockQuery.getAllByWorkerId.mockResolvedValue({
        err: "Data Not Found Please Try Another Input",
        data: null,
      });

      const result = await domain.getAllLanguagesByWorkerId({ worker_id: workerId });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
    });
  });
});
