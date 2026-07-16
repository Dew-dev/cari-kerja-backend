jest.mock("uuid", () => ({
  v4: jest.fn(() => "portfolio-uuid-1234"),
}));

const PortofoliosCommandDomain = require("../../../src/modules/portofolios/repositories/commands/domain");
const {
  NotFoundError,
  InternalServerError,
} = require("../../../src/helpers/errors");

describe("Portofolios Command Domain", () => {
  let domain;
  let mockCommand;
  let mockQuery;

  beforeEach(() => {
    domain = new PortofoliosCommandDomain({});
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
      title: "My Portfolio",
      description: "Project showcase",
      link: "https://example.com",
      is_public: true,
    };

    it("should return data when insert succeeds", async () => {
      mockCommand.insertOne.mockResolvedValue({
        err: null,
        data: { id: "portfolio-uuid-1234" },
      });

      const result = await domain.insertOne(payload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ id: "portfolio-uuid-1234" });
      expect(mockCommand.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "portfolio-uuid-1234",
          worker_id: payload.worker_id,
          title: "My Portfolio",
          description: "Project showcase",
          link: "https://example.com",
          is_public: true,
        })
      );
    });

    it("should set description to null and is_public to false when not provided", async () => {
      mockCommand.insertOne.mockResolvedValue({
        err: null,
        data: { id: "portfolio-uuid-1234" },
      });

      await domain.insertOne({
        worker_id: payload.worker_id,
        title: "My Portfolio",
        link: "https://example.com",
      });

      expect(mockCommand.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          description: null,
          is_public: false,
        })
      );
    });

    it("should return InternalServerError when insert fails", async () => {
      mockCommand.insertOne.mockResolvedValue({ err: new Error("db error"), data: null });

      const result = await domain.insertOne(payload);

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Failed to insert portofolio");
    });
  });

  describe("updateOne", () => {
    const payload = {
      id: "portfolio-uuid-1234",
      worker_id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Updated Portfolio",
      link: "https://updated.com",
      is_public: false,
    };

    it("should return id when update succeeds", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "portfolio-uuid-1234" } });
      mockCommand.updateOneNew.mockResolvedValue({ err: null, data: true });

      const result = await domain.updateOne(payload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ id: "portfolio-uuid-1234" });
      expect(mockCommand.updateOneNew).toHaveBeenCalledWith(
        { id: payload.id, worker_id: payload.worker_id },
        expect.objectContaining({
          title: "Updated Portfolio",
          link: "https://updated.com",
          is_public: false,
        })
      );
    });

    it("should return NotFoundError when portofolio not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.updateOne(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Portofolio not found");
    });

    it("should return InternalServerError when update fails", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "portfolio-uuid-1234" } });
      mockCommand.updateOneNew.mockResolvedValue({ err: new Error("update failed"), data: null });

      const result = await domain.updateOne(payload);

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Failed to update portofolio");
    });
  });

  describe("deleteOne", () => {
    const payload = {
      id: "portfolio-uuid-1234",
      worker_id: "550e8400-e29b-41d4-a716-446655440000",
    };

    it("should return success message when delete succeeds", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "portfolio-uuid-1234" } });
      mockCommand.deleteOne.mockResolvedValue({ err: null, data: true });

      const result = await domain.deleteOne(payload);

      expect(result.err).toBeNull();
      expect(result.data).toBe("Successfully deleted");
    });

    it("should return NotFoundError when portofolio not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.deleteOne(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Portofolio not found");
    });

    it("should return InternalServerError when delete fails", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "portfolio-uuid-1234" } });
      mockCommand.deleteOne.mockResolvedValue({ err: new Error("delete failed"), data: null });

      const result = await domain.deleteOne(payload);

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Failed to delete portofolio");
    });
  });
});
