const commandModel = require("../../../src/modules/experience_levels/repositories/commands/command_model");

describe("Experience Levels Command Model", () => {
  describe("addExperienceLevelType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.addExperienceLevelType.validate({ name: "Senior" });
      expect(error).toBeUndefined();
      expect(value.name).toBe("Senior");
    });

    it("should reject missing name", () => {
      const { error } = commandModel.addExperienceLevelType.validate({});
      expect(error).toBeDefined();
    });

    it("should reject whitespace-only name", () => {
      const { error } = commandModel.addExperienceLevelType.validate({ name: "   " });
      expect(error).toBeDefined();
    });

    it("should reject name exceeding max length", () => {
      const { error } = commandModel.addExperienceLevelType.validate({ name: "a".repeat(256) });
      expect(error).toBeDefined();
    });
  });

  describe("updateExperienceLevelType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.updateExperienceLevelType.validate({ id: 1, name: "Junior" });
      expect(error).toBeUndefined();
      expect(value).toEqual({ id: 1, name: "Junior" });
    });

    it("should reject missing name", () => {
      const { error } = commandModel.updateExperienceLevelType.validate({ id: 1 });
      expect(error).toBeDefined();
    });
  });

  describe("deleteExperienceLevelType", () => {
    it("should validate valid id", () => {
      const { error, value } = commandModel.deleteExperienceLevelType.validate({ id: 1 });
      expect(error).toBeUndefined();
      expect(value.id).toBe(1);
    });

    it("should reject missing id", () => {
      const { error } = commandModel.deleteExperienceLevelType.validate({});
      expect(error).toBeDefined();
    });
  });
});
