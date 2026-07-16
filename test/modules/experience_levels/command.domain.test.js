const ExperienceLevelsCommandDomain = require("../../../src/modules/experience_levels/repositories/commands/domain");
const { NotFoundError, InternalServerError } = require("../../../src/helpers/errors");

describe("Experience Levels Command Domain", () => {
  let domain;
  let mockCommand;
  let mockQuery;

  beforeEach(() => {
    domain = new ExperienceLevelsCommandDomain({});
    mockCommand = {
      insertOne: jest.fn(),
      updateOneNew: jest.fn(),
      deleteOne: jest.fn(),
    };
    mockQuery = { findOne: jest.fn() };
    domain.command = mockCommand;
    domain.query = mockQuery;
  });

  describe("addExperienceLevel", () => {
    it("should return id when insert succeeds", async () => {
      mockCommand.insertOne.mockResolvedValue({ err: null, data: { id: 1 } });

      const result = await domain.addExperienceLevel({ name: "Senior" });

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ id: 1 });
    });

    it("should return InternalServerError when insert fails", async () => {
      mockCommand.insertOne.mockResolvedValue({ err: new Error("db error"), data: null });

      const result = await domain.addExperienceLevel({ name: "Senior" });

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Failed insert ExperienceLevels");
    });
  });

  describe("updateExperienceLevel", () => {
    const payload = { id: 1, name: "Mid Level" };

    it("should return id when update succeeds", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: 1 } });
      mockCommand.updateOneNew.mockResolvedValue({ err: null, data: { id: 1 } });

      const result = await domain.updateExperienceLevel(payload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ id: 1 });
      expect(mockCommand.updateOneNew).toHaveBeenCalledWith({ id: 1 }, { name: "Mid Level" });
    });

    it("should return NotFoundError when experience level not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.updateExperienceLevel(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Experience Level not found");
    });

    it("should return InternalServerError when update fails", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: 1 } });
      mockCommand.updateOneNew.mockResolvedValue({ err: new Error("update failed"), data: null });

      const result = await domain.updateExperienceLevel(payload);

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Update ExperienceLevel failed");
    });
  });

  describe("deleteExperienceLevel", () => {
    it("should return success message when delete succeeds", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: 1 } });
      mockCommand.deleteOne.mockResolvedValue({ err: null, data: true });

      const result = await domain.deleteExperienceLevel({ id: 1 });

      expect(result.err).toBeNull();
      expect(result.data).toBe("Success deleted Experience Level");
    });

    it("should return NotFoundError when experience level not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.deleteExperienceLevel({ id: 1 });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Experience Level not found");
    });

    it("should return InternalServerError when delete fails", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: 1 } });
      mockCommand.deleteOne.mockResolvedValue({ err: new Error("delete failed"), data: null });

      const result = await domain.deleteExperienceLevel({ id: 1 });

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Delete Experience Level failed");
    });
  });
});
