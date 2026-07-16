const commandModel = require("../../../src/modules/categories/repositories/commands/command_model");

describe("Categories Command Model", () => {
  describe("addCategoryType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.addCategoryType.validate({ name: "Technology" });
      expect(error).toBeUndefined();
      expect(value.name).toBe("Technology");
    });

    it("should reject missing name", () => {
      const { error } = commandModel.addCategoryType.validate({});
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain("name");
    });

    it("should reject non-string name", () => {
      const { error } = commandModel.addCategoryType.validate({ name: 123 });
      expect(error).toBeDefined();
    });
  });

  describe("updateCategoryType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.updateCategoryType.validate({ id: 1, name: "Updated" });
      expect(error).toBeUndefined();
      expect(value).toEqual({ id: 1, name: "Updated" });
    });

    it("should reject missing id", () => {
      const { error } = commandModel.updateCategoryType.validate({ name: "Updated" });
      expect(error).toBeDefined();
    });

    it("should reject missing name", () => {
      const { error } = commandModel.updateCategoryType.validate({ id: 1 });
      expect(error).toBeDefined();
    });
  });

  describe("deleteCategoryType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.deleteCategoryType.validate({ id: 1 });
      expect(error).toBeUndefined();
      expect(value.id).toBe(1);
    });

    it("should reject missing id", () => {
      const { error } = commandModel.deleteCategoryType.validate({});
      expect(error).toBeDefined();
    });
  });
});
