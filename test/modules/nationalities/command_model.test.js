const commandModel = require("../../../src/modules/nationalities/repositories/commands/command_model");

describe("Nationalities Command Model", () => {
  describe("addNationalityType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.addNationalityType.validate({
        country_name: "Indonesia",
        iso_alpha2: "ID",
        iso_alpha3: "IDN",
      });
      expect(error).toBeUndefined();
      expect(value.country_name).toBe("Indonesia");
    });

    it("should reject missing iso fields", () => {
      const { error } = commandModel.addNationalityType.validate({
        country_name: "Indonesia",
      });
      expect(error).toBeDefined();
    });
  });

  describe("updateNationalityType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.updateNationalityType.validate({
        id: 1,
        country_name: "Indonesia Updated",
      });
      expect(error).toBeUndefined();
      expect(value.id).toBe(1);
    });

    it("should reject missing country_name", () => {
      const { error } = commandModel.updateNationalityType.validate({ id: 1 });
      expect(error).toBeDefined();
    });
  });

  describe("deleteNationalityType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.deleteNationalityType.validate({ id: 1 });
      expect(error).toBeUndefined();
      expect(value.id).toBe(1);
    });

    it("should reject missing id", () => {
      const { error } = commandModel.deleteNationalityType.validate({});
      expect(error).toBeDefined();
    });
  });
});
