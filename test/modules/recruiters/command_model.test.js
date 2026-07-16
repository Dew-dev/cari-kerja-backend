const commandModel = require("../../../src/modules/recruiters/repositories/commands/command_model");

const validDescription = Array(85).fill("word").join(" ");

describe("Recruiters Command Model", () => {
  describe("updateRecruiterParamType", () => {
    it("should validate minimal update payload", () => {
      const { error, value } = commandModel.updateRecruiterParamType.validate({
        id: "recruiter-uuid",
        user_id: "user-uuid",
        company_name: "Acme Corp",
      });
      expect(error).toBeUndefined();
      expect(value.company_name).toBe("Acme Corp");
    });

    it("should validate description with 80-130 words", () => {
      const { error } = commandModel.updateRecruiterParamType.validate({
        id: "recruiter-uuid",
        user_id: "user-uuid",
        description: validDescription,
      });
      expect(error).toBeUndefined();
    });

    it("should reject description with fewer than 80 words", () => {
      const { error } = commandModel.updateRecruiterParamType.validate({
        id: "recruiter-uuid",
        user_id: "user-uuid",
        description: "too short",
      });
      expect(error).toBeDefined();
    });

    it("should reject missing id", () => {
      const { error } = commandModel.updateRecruiterParamType.validate({
        user_id: "user-uuid",
        company_name: "Acme",
      });
      expect(error).toBeDefined();
    });
  });

  describe("updateRecruiterVipParamType", () => {
    it("should validate valid vip payload", () => {
      const { error, value } = commandModel.updateRecruiterVipParamType.validate({
        id: "recruiter-uuid",
        user_id: "user-uuid",
        is_vip: true,
        vip_start_at: "2024-01-01",
        vip_end_at: "2025-01-01",
      });
      expect(error).toBeUndefined();
      expect(value.is_vip).toBe(true);
    });

    it("should reject missing is_vip", () => {
      const { error } = commandModel.updateRecruiterVipParamType.validate({
        id: "recruiter-uuid",
        user_id: "user-uuid",
      });
      expect(error).toBeDefined();
    });
  });
});
