const queryModel = require("../../../src/modules/certifications/repositories/queries/query_model");

describe("Certifications Query Model", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";
  const certId = "550e8400-e29b-41d4-a716-446655440001";

  describe("getOneCertificationParamType", () => {
    it("should validate valid payload", () => {
      const { error, value } = queryModel.getOneCertificationParamType.validate({
        worker_id: workerId,
        id: certId,
      });
      expect(error).toBeUndefined();
      expect(value.worker_id).toBe(workerId);
      expect(value.id).toBe(certId);
    });

    it("should reject missing worker_id", () => {
      const { error } = queryModel.getOneCertificationParamType.validate({ id: certId });
      expect(error).toBeDefined();
    });

    it("should reject missing id", () => {
      const { error } = queryModel.getOneCertificationParamType.validate({ worker_id: workerId });
      expect(error).toBeDefined();
    });
  });

  describe("getAllCertificationParamType", () => {
    it("should validate with default page and limit", () => {
      const { error, value } = queryModel.getAllCertificationParamType.validate({
        worker_id: workerId,
      });
      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
      expect(value.limit).toBe(10);
    });

    it("should validate custom pagination", () => {
      const { error, value } = queryModel.getAllCertificationParamType.validate({
        worker_id: workerId,
        page: 2,
        limit: 25,
      });
      expect(error).toBeUndefined();
      expect(value).toEqual({ worker_id: workerId, page: 2, limit: 25 });
    });

    it("should reject missing worker_id", () => {
      const { error } = queryModel.getAllCertificationParamType.validate({ page: 1 });
      expect(error).toBeDefined();
    });
  });
});
