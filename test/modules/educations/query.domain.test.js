const EducationsQueryDomain = require("../../../src/modules/educations/repositories/queries/domain");
const { NotFoundError } = require("../../../src/helpers/errors");

describe("Educations Query Domain", () => {
  let domain;
  let mockQuery;

  beforeEach(() => {
    domain = new EducationsQueryDomain({});
    mockQuery = {
      getAllByWorkerId: jest.fn(),
      getOneById: jest.fn(),
    };
    domain.query = mockQuery;
  });

  describe("getAllEducationsByWorkerId", () => {
    const workerId = "550e8400-e29b-41d4-a716-446655440000";

    it("should return all educations for worker", async () => {
      const educations = [
        { id: "edu-1", institution_name: "University A", degree: "Bachelor" },
        { id: "edu-2", institution_name: "University B", degree: "Master" },
      ];
      mockQuery.getAllByWorkerId.mockResolvedValue({ err: null, data: educations });

      const result = await domain.getAllEducationsByWorkerId({ worker_id: workerId });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(educations);
      expect(mockQuery.getAllByWorkerId).toHaveBeenCalledWith(workerId);
    });

    it("should return NotFoundError when query fails with unexpected error", async () => {
      mockQuery.getAllByWorkerId.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.getAllEducationsByWorkerId({ worker_id: workerId });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("No educations found");
    });

    it("should return empty array when query reports empty result", async () => {
      mockQuery.getAllByWorkerId.mockResolvedValue({
        err: "Data Not Found Please Try Another Input",
        data: null,
      });

      const result = await domain.getAllEducationsByWorkerId({ worker_id: workerId });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
    });
  });

  describe("getEducationsById", () => {
    const workerId = "550e8400-e29b-41d4-a716-446655440000";
    const educationId = "550e8400-e29b-41d4-a716-446655440001";

    it("should return education when found", async () => {
      const education = {
        id: educationId,
        institution_name: "University of Indonesia",
        degree: "Bachelor",
      };
      mockQuery.getOneById.mockResolvedValue({ err: null, data: education });

      const result = await domain.getEducationsById({
        worker_id: workerId,
        id: educationId,
      });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(education);
      expect(mockQuery.getOneById).toHaveBeenCalledWith(workerId, educationId);
    });

    it("should return NotFoundError when education not found", async () => {
      mockQuery.getOneById.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.getEducationsById({
        worker_id: workerId,
        id: educationId,
      });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Educations not found");
    });
  });
});
