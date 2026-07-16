const commandModel = require("../../../src/modules/industries/repositories/commands/command_model");

describe("Industries Command Model", () => {
  describe("addIndustryType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.addIndustryType.validate({ name: "Technology" });
      expect(error).toBeUndefined();
      expect(value.name).toBe("Technology");
    });

    it("should reject missing name", () => {
      const { error } = commandModel.addIndustryType.validate({});
      expect(error).toBeDefined();
    });
  });

  describe("updateIndustryType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.updateIndustryType.validate({ id: 1, name: "Finance" });
      expect(error).toBeUndefined();
      expect(value).toEqual({ id: 1, name: "Finance" });
    });

    it("should reject missing id", () => {
      const { error } = commandModel.updateIndustryType.validate({ name: "Finance" });
      expect(error).toBeDefined();
    });
  });

  describe("deleteIndustryType", () => {
    it("should validate valid id", () => {
      const { error, value } = commandModel.deleteIndustryType.validate({ id: 1 });
      expect(error).toBeUndefined();
      expect(value.id).toBe(1);
    });

    it("should reject missing id", () => {
      const { error } = commandModel.deleteIndustryType.validate({});
      expect(error).toBeDefined();
    });
  });
});
