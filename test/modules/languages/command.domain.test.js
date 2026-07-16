jest.mock("uuid", () => ({
  v4: jest.fn(() => "language-uuid-1234"),
}));

const LanguagesCommandDomain = require("../../../src/modules/languages/repositories/commands/domain");
const {
  NotFoundError,
  InternalServerError,
} = require("../../../src/helpers/errors");

describe("Languages Command Domain", () => {
  let domain;
  let mockCommand;
  let mockQuery;

  beforeEach(() => {
    domain = new LanguagesCommandDomain({});
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
      language_name: "English",
      proficiency_level_id: 1,
      is_primary: true,
    };

    it("should return id when insert succeeds", async () => {
      mockCommand.insertOne.mockResolvedValue({
        err: null,
        data: { id: "language-uuid-1234" },
      });

      const result = await domain.insertOne(payload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ id: "language-uuid-1234" });
      expect(mockCommand.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "language-uuid-1234",
          worker_id: payload.worker_id,
          language_name: "English",
          proficiency_level_id: 1,
          is_primary: true,
        })
      );
    });

    it("should default is_primary to false when not provided", async () => {
      mockCommand.insertOne.mockResolvedValue({
        err: null,
        data: { id: "language-uuid-1234" },
      });

      await domain.insertOne({
        worker_id: payload.worker_id,
        language_name: "Indonesian",
        proficiency_level_id: 2,
      });

      expect(mockCommand.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({ is_primary: false })
      );
    });

    it("should return InternalServerError when insert fails", async () => {
      mockCommand.insertOne.mockResolvedValue({ err: new Error("db error"), data: null });

      const result = await domain.insertOne(payload);

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Failed to insert language");
    });
  });

  describe("updateOne", () => {
    const payload = {
      id: "language-uuid-1234",
      worker_id: "550e8400-e29b-41d4-a716-446655440000",
      language_name: "French",
      proficiency_level_id: 3,
      is_primary: false,
    };

    it("should return id when update succeeds", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "language-uuid-1234" } });
      mockCommand.updateOneNew.mockResolvedValue({ err: null, data: true });

      const result = await domain.updateOne(payload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ id: "language-uuid-1234" });
      expect(mockCommand.updateOneNew).toHaveBeenCalledWith(
        { id: payload.id, worker_id: payload.worker_id },
        expect.objectContaining({
          language_name: "French",
          proficiency_level_id: 3,
          is_primary: false,
        })
      );
    });

    it("should return NotFoundError when language not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.updateOne(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Language not found");
      expect(mockCommand.updateOneNew).not.toHaveBeenCalled();
    });

    it("should return InternalServerError when update fails", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "language-uuid-1234" } });
      mockCommand.updateOneNew.mockResolvedValue({ err: new Error("update failed"), data: null });

      const result = await domain.updateOne(payload);

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Failed to update language");
    });
  });

  describe("deleteOne", () => {
    const payload = {
      id: "language-uuid-1234",
      worker_id: "550e8400-e29b-41d4-a716-446655440000",
    };

    it("should return success message when delete succeeds", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "language-uuid-1234" } });
      mockCommand.deleteOne.mockResolvedValue({ err: null, data: true });

      const result = await domain.deleteOne(payload);

      expect(result.err).toBeNull();
      expect(result.data).toBe("Successfully deleted");
      expect(mockCommand.deleteOne).toHaveBeenCalledWith({
        id: payload.id,
        worker_id: payload.worker_id,
      });
    });

    it("should return NotFoundError when language not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.deleteOne(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Language not found");
    });

    it("should return InternalServerError when delete fails", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "language-uuid-1234" } });
      mockCommand.deleteOne.mockResolvedValue({ err: new Error("delete failed"), data: null });

      const result = await domain.deleteOne(payload);

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Failed to delete language");
    });
  });
});
