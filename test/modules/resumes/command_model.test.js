const commandModel = require("../../../src/modules/resumes/repositories/commands/command_model");

describe("Resumes Command Model", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";

  describe("addResumeType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.addResumeType.validate({
        worker_id: workerId,
        resume_url: "/uploads/resumes/cv.pdf",
        title: "My CV",
        is_default: true,
      });
      expect(error).toBeUndefined();
      expect(value.title).toBe("My CV");
    });

    it("should reject missing resume_url", () => {
      const { error } = commandModel.addResumeType.validate({
        worker_id: workerId,
        title: "My CV",
        is_default: false,
      });
      expect(error).toBeDefined();
    });
  });

  describe("updateResumeType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.updateResumeType.validate({
        id: "resume-uuid",
        worker_id: workerId,
        title: "Updated CV",
      });
      expect(error).toBeUndefined();
      expect(value.title).toBe("Updated CV");
    });

    it("should reject missing worker_id", () => {
      const { error } = commandModel.updateResumeType.validate({
        id: "resume-uuid",
        title: "Updated CV",
      });
      expect(error).toBeDefined();
    });
  });

  describe("deleteResumeType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.deleteResumeType.validate({
        id: "resume-uuid",
        worker_id: workerId,
      });
      expect(error).toBeUndefined();
      expect(value.id).toBe("resume-uuid");
    });

    it("should reject missing id", () => {
      const { error } = commandModel.deleteResumeType.validate({ worker_id: workerId });
      expect(error).toBeDefined();
    });
  });
});
