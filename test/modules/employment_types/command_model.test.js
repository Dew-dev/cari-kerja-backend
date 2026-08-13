const commandModel = require("../../../src/modules/employment_types/repositories/commands/command_model");

describe("Employment Types Command Model", () => {
  describe("addEmploymentTypeType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.addEmploymentTypeType.validate({ name: "Full Time" });
      expect(error).toBeUndefined();
      expect(value.name).toBe("Full Time");
    });

    it("should reject missing name", () => {
      const { error } = commandModel.addEmploymentTypeType.validate({});
      expect(error).toBeDefined();
    });

    it("should reject whitespace-only name", () => {
      const { error } = commandModel.addEmploymentTypeType.validate({ name: "   " });
      expect(error).toBeDefined();
    });

    it("should reject name exceeding max length", () => {
      const { error } = commandModel.addEmploymentTypeType.validate({ name: "a".repeat(256) });
      expect(error).toBeDefined();
    });
  });

  describe("updateEmploymentTypeType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.updateEmploymentTypeType.validate({ id: 1, name: "Part Time" });
      expect(error).toBeUndefined();
      expect(value).toEqual({ id: 1, name: "Part Time" });
    });

    it("should reject missing id", () => {
      const { error } = commandModel.updateEmploymentTypeType.validate({ name: "Part Time" });
      expect(error).toBeDefined();
    });
  });

  describe("deleteEmploymentTypeType", () => {
    it("should validate valid id", () => {
      const { error, value } = commandModel.deleteEmploymentTypeType.validate({ id: 1 });
      expect(error).toBeUndefined();
      expect(value.id).toBe(1);
    });

    it("should reject missing id", () => {
      const { error } = commandModel.deleteEmploymentTypeType.validate({});
      expect(error).toBeDefined();
    });
  });
});
