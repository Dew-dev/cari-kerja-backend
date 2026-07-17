const commandModel = require("../../../src/modules/portofolios/repositories/commands/command_model");

describe("Portofolios Command Model", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";

  describe("addPortfoliosParamType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.addPortfoliosParamType.validate({
        worker_id: workerId,
        title: "My Portfolio",
        link: "https://example.com",
        is_public: true,
      });
      expect(error).toBeUndefined();
      expect(value.title).toBe("My Portfolio");
    });

    it("should default is_public to false", () => {
      const { error, value } = commandModel.addPortfoliosParamType.validate({
        worker_id: workerId,
        title: "My Portfolio",
        link: "https://example.com",
      });
      expect(error).toBeUndefined();
      expect(value.is_public).toBe(false);
    });

    it("should reject missing link", () => {
      const { error } = commandModel.addPortfoliosParamType.validate({
        worker_id: workerId,
        title: "My Portfolio",
      });
      expect(error).toBeDefined();
    });
  });

  describe("updatePortfoliosParamType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.updatePortfoliosParamType.validate({
        id: "550e8400-e29b-41d4-a716-446655440001",
        worker_id: workerId,
        title: "Updated",
        link: "https://updated.com",
      });
      expect(error).toBeUndefined();
      expect(value.id).toBe("550e8400-e29b-41d4-a716-446655440001");
    });

    it("should reject missing title", () => {
      const { error } = commandModel.updatePortfoliosParamType.validate({
        id: "550e8400-e29b-41d4-a716-446655440001",
        worker_id: workerId,
        link: "https://updated.com",
      });
      expect(error).toBeDefined();
    });
  });

  describe("deletePortfoliosParamType", () => {
    it("should validate valid payload", () => {
      const { error, value } = commandModel.deletePortfoliosParamType.validate({
        worker_id: workerId,
        id: "550e8400-e29b-41d4-a716-446655440001",
      });
      expect(error).toBeUndefined();
      expect(value.id).toBe("550e8400-e29b-41d4-a716-446655440001");
    });

    it("should reject missing id", () => {
      const { error } = commandModel.deletePortfoliosParamType.validate({ worker_id: workerId });
      expect(error).toBeDefined();
    });
  });
});
