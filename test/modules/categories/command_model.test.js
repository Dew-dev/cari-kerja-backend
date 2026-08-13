const commandModel = require("../../../src/modules/categories/repositories/commands/command_model");

describe("Categories Command Model", () => {
  describe("addCategoryType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.addCategoryType.validate({ name: "Technology" });
      expect(error).toBeUndefined();
      expect(value.name).toBe("Technology");
    });

    it("should accept translations map", () => {
      const { error, value } = commandModel.addCategoryType.validate({
        translations: {
          id: { name: "Teknologi Informasi" },
          en: { name: "Information Technology" },
          ru: { name: "IT" },
          uz: { name: "IT" },
        },
      });
      expect(error).toBeUndefined();
      expect(value.translations.en.name).toBe("Information Technology");
    });

    it("should reject missing name and translations", () => {
      const { error } = commandModel.addCategoryType.validate({});
      expect(error).toBeDefined();
    });

    it("should reject non-string name", () => {
      const { error } = commandModel.addCategoryType.validate({ name: 123 });
      expect(error).toBeDefined();
    });
  });

  describe("updateCategoryType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.updateCategoryType.validate({
        id: 1,
        name: "Updated",
      });
      expect(error).toBeUndefined();
      expect(value).toEqual({ id: 1, name: "Updated" });
    });

    it("should reject missing id", () => {
      const { error } = commandModel.updateCategoryType.validate({ name: "Updated" });
      expect(error).toBeDefined();
    });

    it("should reject missing name and translations", () => {
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
