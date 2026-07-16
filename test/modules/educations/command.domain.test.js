jest.mock("uuid", () => ({
  v4: jest.fn(() => "education-uuid-1234"),
}));

const EducationsCommandDomain = require("../../../src/modules/educations/repositories/commands/domain");
const {
  NotFoundError,
  InternalServerError,
} = require("../../../src/helpers/errors");

describe("Educations Command Domain", () => {
  let domain;
  let mockCommand;
  let mockQuery;

  beforeEach(() => {
    domain = new EducationsCommandDomain({});
    mockCommand = {
      insertOne: jest.fn(),
      updateOneNew: jest.fn(),
      deleteOne: jest.fn(),
    };
    mockQuery = {
      findOne: jest.fn(),
    };
    domain.command = mockCommand;
    domain.query = mockQuery;
  });

  describe("insertOne", () => {
    const payload = {
      worker_id: "550e8400-e29b-41d4-a716-446655440000",
      institution_name: "University of Indonesia",
      degree: "Bachelor",
      major: "Computer Science",
      start_date: "2018-09-01",
      end_date: "2022-06-01",
      is_current: false,
      description: "Graduated with honors",
    };

    it("should return id when insert succeeds", async () => {
      mockCommand.insertOne.mockResolvedValue({
        err: null,
        data: { id: "education-uuid-1234" },
      });

      const result = await domain.insertOne(payload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ id: "education-uuid-1234" });
      expect(mockCommand.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "education-uuid-1234",
          worker_id: payload.worker_id,
          institution_name: "University of Indonesia",
          degree: "Bachelor",
          major: "Computer Science",
          is_current: false,
        })
      );
    });

    it("should set major and description to null when not provided", async () => {
      mockCommand.insertOne.mockResolvedValue({
        err: null,
        data: { id: "education-uuid-1234" },
      });

      await domain.insertOne({
        worker_id: "550e8400-e29b-41d4-a716-446655440000",
        institution_name: "University",
        degree: "Bachelor",
        start_date: "2018-09-01",
      });

      expect(mockCommand.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          major: null,
          description: null,
          is_current: false,
        })
      );
    });

    it("should keep end_date when is_current is true and end_date is provided", async () => {
      mockCommand.insertOne.mockResolvedValue({
        err: null,
        data: { id: "education-uuid-1234" },
      });

      await domain.insertOne({
        ...payload,
        is_current: true,
        end_date: "2025-06-01",
      });

      expect(mockCommand.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          is_current: true,
          end_date: "2025-06-01",
        })
      );
    });

    it("should set end_date to null when is_current is true and end_date is not provided", async () => {
      mockCommand.insertOne.mockResolvedValue({
        err: null,
        data: { id: "education-uuid-1234" },
      });

      await domain.insertOne({
        worker_id: payload.worker_id,
        institution_name: "University of Indonesia",
        degree: "Bachelor",
        start_date: "2018-09-01",
        is_current: true,
      });

      expect(mockCommand.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          is_current: true,
          end_date: null,
        })
      );
    });

    it("should return InternalServerError when insert fails", async () => {
      mockCommand.insertOne.mockResolvedValue({ err: new Error("db error"), data: null });

      const result = await domain.insertOne(payload);

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Failed to insert education");
    });
  });

  describe("updateOne", () => {
    const payload = {
      id: "education-uuid-1234",
      worker_id: "550e8400-e29b-41d4-a716-446655440000",
      institution_name: "Updated University",
      degree: "Master",
      major: "Data Science",
      start_date: "2022-09-01",
      end_date: "2024-06-01",
      is_current: false,
      description: "Updated description",
    };

    it("should return id when update succeeds", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "education-uuid-1234" } });
      mockCommand.updateOneNew.mockResolvedValue({ err: null, data: true });

      const result = await domain.updateOne(payload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ id: "education-uuid-1234" });
      expect(mockCommand.updateOneNew).toHaveBeenCalledWith(
        { id: "education-uuid-1234", worker_id: payload.worker_id },
        expect.objectContaining({
          institution_name: "Updated University",
          degree: "Master",
        })
      );
    });

    it("should return NotFoundError when education not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.updateOne(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Education not found");
      expect(mockCommand.updateOneNew).not.toHaveBeenCalled();
    });

    it("should return InternalServerError when update fails", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "education-uuid-1234" } });
      mockCommand.updateOneNew.mockResolvedValue({ err: new Error("update failed"), data: null });

      const result = await domain.updateOne(payload);

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Failed to update education");
    });
  });

  describe("deleteOne", () => {
    const payload = {
      id: "education-uuid-1234",
      worker_id: "550e8400-e29b-41d4-a716-446655440000",
    };

    it("should return success message when delete succeeds", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "education-uuid-1234" } });
      mockCommand.deleteOne.mockResolvedValue({ err: null, data: true });

      const result = await domain.deleteOne(payload);

      expect(result.err).toBeNull();
      expect(result.data).toBe("Successfully deleted");
      expect(mockCommand.deleteOne).toHaveBeenCalledWith({
        id: "education-uuid-1234",
        worker_id: payload.worker_id,
      });
    });

    it("should return NotFoundError when education not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.deleteOne(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Education not found");
    });

    it("should return InternalServerError when delete fails", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "education-uuid-1234" } });
      mockCommand.deleteOne.mockResolvedValue({ err: new Error("delete failed"), data: null });

      const result = await domain.deleteOne(payload);

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Failed to delete education");
    });
  });
});
