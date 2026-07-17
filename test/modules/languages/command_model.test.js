const commandModel = require("../../../src/modules/languages/repositories/commands/command_model");

describe("Languages Command Model", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";

  describe("addLanguagesParamType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.addLanguagesParamType.validate({
        worker_id: workerId,
        language_name: "English",
        proficiency_level_id: 1,
        is_primary: true,
      });
      expect(error).toBeUndefined();
      expect(value.language_name).toBe("English");
    });

    it("should default is_primary to false", () => {
      const { error, value } = commandModel.addLanguagesParamType.validate({
        worker_id: workerId,
        language_name: "English",
        proficiency_level_id: 1,
      });
      expect(error).toBeUndefined();
      expect(value.is_primary).toBe(false);
    });

    it("should reject missing language_name", () => {
      const { error } = commandModel.addLanguagesParamType.validate({
        worker_id: workerId,
        proficiency_level_id: 1,
      });
      expect(error).toBeDefined();
    });
  });

  describe("updateLanguagesParamType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.updateLanguagesParamType.validate({
        id: "550e8400-e29b-41d4-a716-446655440001",
        worker_id: workerId,
        language_name: "French",
        proficiency_level_id: 2,
      });
      expect(error).toBeUndefined();
      expect(value.id).toBe("550e8400-e29b-41d4-a716-446655440001");
    });

    it("should reject missing id", () => {
      const { error } = commandModel.updateLanguagesParamType.validate({
        worker_id: workerId,
        language_name: "French",
        proficiency_level_id: 2,
      });
      expect(error).toBeDefined();
    });
  });

  describe("deleteLanguagesParamType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.deleteLanguagesParamType.validate({
        worker_id: workerId,
        id: "550e8400-e29b-41d4-a716-446655440001",
      });
      expect(error).toBeUndefined();
      expect(value.id).toBe("550e8400-e29b-41d4-a716-446655440001");
    });

    it("should reject missing worker_id", () => {
      const { error } = commandModel.deleteLanguagesParamType.validate({
        id: "550e8400-e29b-41d4-a716-446655440001",
      });
      expect(error).toBeDefined();
    });
  });
});
