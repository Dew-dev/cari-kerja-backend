const commandModel = require("../../../src/modules/genders/repositories/commands/command_model");

describe("Genders Command Model", () => {
  describe("addGenderType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.addGenderType.validate({ gender_name: "Male" });
      expect(error).toBeUndefined();
      expect(value.gender_name).toBe("Male");
    });

    it("should reject missing gender_name", () => {
      const { error } = commandModel.addGenderType.validate({});
      expect(error).toBeDefined();
    });
  });

  describe("updateGenderType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.updateGenderType.validate({ id: 1, gender_name: "Female" });
      expect(error).toBeUndefined();
      expect(value).toEqual({ id: 1, gender_name: "Female" });
    });

    it("should reject missing gender_name", () => {
      const { error } = commandModel.updateGenderType.validate({ id: 1 });
      expect(error).toBeDefined();
    });
  });

  describe("deleteGenderType", () => {
    it("should validate valid id", () => {
      const { error, value } = commandModel.deleteGenderType.validate({ id: 1 });
      expect(error).toBeUndefined();
      expect(value.id).toBe(1);
    });

    it("should reject missing id", () => {
      const { error } = commandModel.deleteGenderType.validate({});
      expect(error).toBeDefined();
    });
  });
});
