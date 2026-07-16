const CertificationQueryDomain = require("../../../src/modules/certifications/repositories/queries/domain");
const { NotFoundError } = require("../../../src/helpers/errors");

describe("Certifications Query Domain", () => {
  let domain;
  let mockQuery;

  beforeEach(() => {
    domain = new CertificationQueryDomain({});
    mockQuery = {
      findOne: jest.fn(),
      findAll: jest.fn(),
      countAll: jest.fn(),
    };
    domain.query = mockQuery;
  });

  describe("getOneCertification", () => {
    it("should return certification when found", async () => {
      const certData = {
        id: "cert-uuid",
        worker_id: "worker-uuid",
        name: "AWS Solutions Architect",
        issuer: "Amazon",
        issue_date: "2024-01-01",
        is_active: true,
        link: "https://aws.amazon.com",
      };
      mockQuery.findOne.mockResolvedValue({ err: null, data: certData });

      const result = await domain.getOneCertification({
        id: "cert-uuid",
        worker_id: "worker-uuid",
      });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(certData);
    });

    it("should return NotFoundError when certification not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.getOneCertification({
        id: "cert-uuid",
        worker_id: "worker-uuid",
      });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Can not find certification");
    });
  });

  describe("getAllCertifications", () => {
    const payload = { worker_id: "worker-uuid", page: 1, limit: 10 };

    it("should return paginated certifications when found", async () => {
      const certifications = [{ id: "cert-1", name: "AWS" }];
      mockQuery.findAll.mockResolvedValue({ err: null, data: certifications });
      mockQuery.countAll.mockResolvedValue({ err: null, data: 15 });

      const result = await domain.getAllCertifications(payload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual(certifications);
      expect(result.meta).toEqual({
        page: 1,
        per_page: 10,
        total_data: 15,
        total_pages: 2,
      });
    });

    it("should return NotFoundError when query fails", async () => {
      mockQuery.findAll.mockResolvedValue({ err: new Error("db error"), data: null });
      mockQuery.countAll.mockResolvedValue({ err: null, data: 0 });

      const result = await domain.getAllCertifications(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Can not find certifications");
    });

    it("should handle zero total data with correct meta", async () => {
      mockQuery.findAll.mockResolvedValue({ err: null, data: [] });
      mockQuery.countAll.mockResolvedValue({ err: null, data: 0 });

      const result = await domain.getAllCertifications(payload);

      expect(result.meta.total_data).toBe(0);
      expect(result.meta.total_pages).toBe(0);
    });

    it("should never return null meta values when count data is invalid", async () => {
      mockQuery.findAll.mockResolvedValue({ err: null, data: [{ id: "cert-1" }] });
      mockQuery.countAll.mockResolvedValue({ err: null, data: undefined });

      const result = await domain.getAllCertifications(payload);

      expect(result.meta.total_data).toBe(0);
      expect(result.meta.total_pages).toBe(0);
      expect(result.meta.total_data).not.toBeNull();
      expect(result.meta.total_pages).not.toBeNull();
    });

    it("should return InternalServerError when count query fails", async () => {
      mockQuery.findAll.mockResolvedValue({ err: null, data: [{ id: "cert-1" }] });
      mockQuery.countAll.mockResolvedValue({ err: new Error("count failed"), data: null });

      const result = await domain.getAllCertifications(payload);

      expect(result.err).toBeInstanceOf(require("../../../src/helpers/errors").InternalServerError);
      expect(result.err.message).toBe("Can not count certifications");
    });
  });
});
