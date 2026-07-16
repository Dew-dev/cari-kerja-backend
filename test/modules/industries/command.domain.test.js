const IndustriesCommandDomain = require("../../../src/modules/industries/repositories/commands/domain");
const { NotFoundError, InternalServerError } = require("../../../src/helpers/errors");

describe("Industries Command Domain", () => {
  let domain;
  let mockCommand;
  let mockQuery;

  beforeEach(() => {
    domain = new IndustriesCommandDomain({});
    mockCommand = {
      insertOne: jest.fn(),
      updateOneNew: jest.fn(),
      deleteOne: jest.fn(),
    };
    mockQuery = { findOne: jest.fn() };
    domain.command = mockCommand;
    domain.query = mockQuery;
  });

  describe("addIndustry", () => {
    it("should return id when insert succeeds", async () => {
      mockCommand.insertOne.mockResolvedValue({ err: null, data: { id: 1 } });

      const result = await domain.addIndustry({ name: "Technology" });

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ id: 1 });
      expect(mockCommand.insertOne).toHaveBeenCalledWith({ name: "Technology" });
    });

    it("should return InternalServerError when insert fails", async () => {
      mockCommand.insertOne.mockResolvedValue({ err: new Error("db error"), data: null });

      const result = await domain.addIndustry({ name: "Technology" });

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Failed insert Industry");
    });
  });

  describe("updateIndustry", () => {
    const payload = { id: 1, name: "Finance" };

    it("should return id when update succeeds", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: 1 } });
      mockCommand.updateOneNew.mockResolvedValue({ err: null, data: { id: 1 } });

      const result = await domain.updateIndustry(payload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ id: 1 });
      expect(mockCommand.updateOneNew).toHaveBeenCalledWith({ id: 1 }, { name: "Finance" });
    });

    it("should return NotFoundError when industry not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.updateIndustry(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Industry not found");
    });

    it("should return InternalServerError when update fails", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: 1 } });
      mockCommand.updateOneNew.mockResolvedValue({ err: new Error("update failed"), data: null });

      const result = await domain.updateIndustry(payload);

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Update Industry failed");
    });
  });

  describe("deleteIndustry", () => {
    it("should return success message when delete succeeds", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: 1 } });
      mockCommand.deleteOne.mockResolvedValue({ err: null, data: true });

      const result = await domain.deleteIndustry({ id: 1 });

      expect(result.err).toBeNull();
      expect(result.data).toBe("Success deleted industry");
    });

    it("should return NotFoundError when industry not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.deleteIndustry({ id: 1 });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Industry not found");
    });

    it("should return InternalServerError when delete fails", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: 1 } });
      mockCommand.deleteOne.mockResolvedValue({ err: new Error("delete failed"), data: null });

      const result = await domain.deleteIndustry({ id: 1 });

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Delete Industry failed");
    });
  });
});
