jest.mock("uuid", () => ({
  v4: jest.fn(() => "cert-uuid-1234"),
}));

const CertificationCommandDomain = require("../../../src/modules/certifications/repositories/commands/domain");
const {
  NotFoundError,
  InternalServerError,
  BadRequestError,
} = require("../../../src/helpers/errors");

describe("Certifications Command Domain", () => {
  let domain;
  let mockCommand;
  let mockQuery;
  let mockQueryWorker;

  beforeEach(() => {
    domain = new CertificationCommandDomain({});
    mockCommand = {
      insertOne: jest.fn(),
      updateOneNew: jest.fn(),
      deleteOne: jest.fn(),
    };
    mockQuery = {
      findOne: jest.fn(),
    };
    mockQueryWorker = {
      findOne: jest.fn(),
    };
    domain.command = mockCommand;
    domain.query = mockQuery;
    domain.queryWorker = mockQueryWorker;
  });

  describe("addCertification", () => {
    const payload = {
      worker_id: "worker-uuid",
      name: "AWS Solutions Architect",
      issuer: "Amazon",
      link: "https://aws.amazon.com",
      issue_date: "2024-01-01",
      is_active: true,
    };

    it("should return certification data when insert succeeds", async () => {
      mockQueryWorker.findOne.mockResolvedValue({ err: null, data: { id: "worker-uuid" } });
      const insertedData = { id: "cert-uuid-1234", ...payload };
      mockCommand.insertOne.mockResolvedValue({ err: null, data: insertedData });

      const result = await domain.addCertification(payload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual(insertedData);
      expect(mockCommand.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({ id: "cert-uuid-1234", worker_id: "worker-uuid" })
      );
    });

    it("should return NotFoundError when worker not found", async () => {
      mockQueryWorker.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.addCertification(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Worker not found");
      expect(mockCommand.insertOne).not.toHaveBeenCalled();
    });

    it("should return InternalServerError when insert fails", async () => {
      mockQueryWorker.findOne.mockResolvedValue({ err: null, data: { id: "worker-uuid" } });
      mockCommand.insertOne.mockResolvedValue({ err: new Error("db error"), data: null });

      const result = await domain.addCertification(payload);

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Failed insert certification");
    });
  });

  describe("updateCertification", () => {
    const basePayload = {
      id: "cert-uuid",
      worker_id: "worker-uuid",
      name: "Updated Name",
      link: "https://example.com",
    };

    it("should return updated fields when update succeeds", async () => {
      mockQuery.findOne.mockResolvedValue({
        err: null,
        data: { id: "cert-uuid", worker_id: "worker-uuid", name: "Old Name" },
      });
      mockCommand.updateOneNew.mockResolvedValue({ err: null, data: true });

      const result = await domain.updateCertification(basePayload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ name: "Updated Name", link: "https://example.com" });
      expect(mockCommand.updateOneNew).toHaveBeenCalledWith(
        { id: "cert-uuid", worker_id: "worker-uuid" },
        { name: "Updated Name", link: "https://example.com" }
      );
    });

    it("should return BadRequestError when id or worker_id is missing", async () => {
      const result = await domain.updateCertification({ id: "cert-uuid" });

      expect(result.err).toBeInstanceOf(BadRequestError);
      expect(result.err.message).toBe("id dan worker_id wajib diisi");
    });

    it("should return NotFoundError when certification not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.updateCertification(basePayload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Certification not found");
    });

    it("should update link when only link is provided", async () => {
      mockQuery.findOne.mockResolvedValue({
        err: null,
        data: { id: "cert-uuid", worker_id: "worker-uuid" },
      });
      mockCommand.updateOneNew.mockResolvedValue({ err: null, data: true });

      const result = await domain.updateCertification({
        id: "cert-uuid",
        worker_id: "worker-uuid",
        link: "https://example.com",
      });

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ link: "https://example.com" });
      expect(mockCommand.updateOneNew).toHaveBeenCalledWith(
        { id: "cert-uuid", worker_id: "worker-uuid" },
        { link: "https://example.com" }
      );
    });

    it("should return BadRequestError when no updatable fields provided", async () => {
      mockQuery.findOne.mockResolvedValue({
        err: null,
        data: { id: "cert-uuid", worker_id: "worker-uuid" },
      });

      const result = await domain.updateCertification({
        id: "cert-uuid",
        worker_id: "worker-uuid",
      });

      expect(result.err).toBeInstanceOf(BadRequestError);
      expect(result.err.message).toBe("Tidak ada data untuk diupdate");
    });

    it("should only update provided non-null fields", async () => {
      mockQuery.findOne.mockResolvedValue({
        err: null,
        data: { id: "cert-uuid", worker_id: "worker-uuid" },
      });
      mockCommand.updateOneNew.mockResolvedValue({ err: null, data: true });

      await domain.updateCertification({
        id: "cert-uuid",
        worker_id: "worker-uuid",
        issuer: "Google",
        is_active: false,
        link: "https://example.com",
      });

      expect(mockCommand.updateOneNew).toHaveBeenCalledWith(
        { id: "cert-uuid", worker_id: "worker-uuid" },
        { issuer: "Google", is_active: false, link: "https://example.com" }
      );
    });

    it("should return InternalServerError when update fails", async () => {
      mockQuery.findOne.mockResolvedValue({
        err: null,
        data: { id: "cert-uuid", worker_id: "worker-uuid" },
      });
      mockCommand.updateOneNew.mockResolvedValue({ err: new Error("update failed"), data: null });

      const result = await domain.updateCertification(basePayload);

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Update certification failed");
    });
  });

  describe("deleteCertification", () => {
    it("should return success message when delete succeeds", async () => {
      mockQuery.findOne.mockResolvedValue({
        err: null,
        data: { id: "cert-uuid", worker_id: "worker-uuid" },
      });
      mockCommand.deleteOne.mockResolvedValue({ err: null, data: true });

      const result = await domain.deleteCertification({
        id: "cert-uuid",
        worker_id: "worker-uuid",
      });

      expect(result.err).toBeNull();
      expect(result.data).toBe("Success deleted certification");
      expect(mockCommand.deleteOne).toHaveBeenCalledWith({
        id: "cert-uuid",
        worker_id: "worker-uuid",
      });
    });

    it("should return NotFoundError when certification not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.deleteCertification({
        id: "cert-uuid",
        worker_id: "worker-uuid",
      });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Certification not found");
    });

    it("should return InternalServerError when delete fails", async () => {
      mockQuery.findOne.mockResolvedValue({
        err: null,
        data: { id: "cert-uuid", worker_id: "worker-uuid" },
      });
      mockCommand.deleteOne.mockResolvedValue({ err: new Error("delete failed"), data: null });

      const result = await domain.deleteCertification({
        id: "cert-uuid",
        worker_id: "worker-uuid",
      });

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Delete certification failed");
    });
  });
});
