/**
 * QA Bug-Hunting Tests — certifications
 * Tests assert CORRECT expected behavior. They FAIL while bugs remain in implementation.
 */
jest.mock("uuid", () => ({
  v4: jest.fn(() => "cert-uuid-1234"),
}));

jest.mock("../../../src/modules/certifications/repositories/commands/command_handler", () => ({
  addCertification: jest.fn(),
  updateCertification: jest.fn(),
  deleteCertification: jest.fn(),
}));

jest.mock("../../../src/modules/certifications/repositories/queries/query_handler", () => ({
  getOneCertification: jest.fn(),
  getAllCertifications: jest.fn(),
}));

const CertificationCommandDomain = require("../../../src/modules/certifications/repositories/commands/domain");
const CertificationQueryDomain = require("../../../src/modules/certifications/repositories/queries/domain");
const apiHandler = require("../../../src/modules/certifications/handlers/api_handlers");
const commandModel = require("../../../src/modules/certifications/repositories/commands/command_model");
const commandHandler = require("../../../src/modules/certifications/repositories/commands/command_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} = require("../../../src/helpers/errors");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("[QA] certifications module", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";
  const otherWorkerId = "550e8400-e29b-41d4-a716-446655440099";
  const certId = "550e8400-e29b-41d4-a716-446655440001";

  describe("Security — IDOR on delete", () => {
    it("[BUG-CE-001] deleteCertification should scope delete by worker_id", async () => {
      const domain = new CertificationCommandDomain({});
      domain.query = {
        findOne: jest.fn().mockResolvedValue({
          err: null,
          data: { id: certId, worker_id: otherWorkerId },
        }),
      };
      domain.command = {
        deleteOne: jest.fn().mockResolvedValue({ err: null, data: true }),
      };

      const result = await domain.deleteCertification({
        id: certId,
        worker_id: workerId,
      });

      expect(result.err).toBeInstanceOf(ForbiddenError);
      expect(domain.command.deleteOne).not.toHaveBeenCalled();
    });
  });

  describe("Security — handler delete must pass worker_id", () => {
    it("[BUG-CE-002] deleteCertification handler should pass worker_id from token", async () => {
      const res = createMockResponse();
      const req = createMockRequest({
        userMeta: { worker_id: workerId },
        params: { id: certId },
      });

      commandHandler.deleteCertification.mockResolvedValue(
        wrapper.data("Success deleted certification")
      );

      await apiHandler.deleteCertification(req, res);

      expect(commandHandler.deleteCertification).toHaveBeenCalledWith({
        id: certId,
        worker_id: workerId,
      });
    });
  });

  describe("Query — empty list should paginate not 404", () => {
    it("[BUG-CE-003] getAllCertifications should return empty array when worker has no certs", async () => {
      const domain = new CertificationQueryDomain({});
      domain.query = {
        findAll: jest.fn().mockResolvedValue({
          err: "Data Not Found Please Try Another Input",
          data: null,
        }),
        countAll: jest.fn().mockResolvedValue({ err: null, data: 0 }),
      };

      const result = await domain.getAllCertifications({
        worker_id: workerId,
        page: 1,
        limit: 10,
      });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
      expect(result.meta.total_data).toBe(0);
    });
  });

  describe("Business logic — duplicate certification", () => {
    it("[BUG-CE-004] addCertification should return ConflictError on duplicate insert", async () => {
      const domain = new CertificationCommandDomain({});
      domain.queryWorker = {
        findOne: jest.fn().mockResolvedValue({ err: null, data: { id: workerId } }),
      };
      domain.command = {
        insertOne: jest.fn().mockResolvedValue({
          err: new Error("duplicate key value violates unique constraint"),
          data: null,
        }),
      };
      domain.query = { findOne: jest.fn() };

      const result = await domain.addCertification({
        worker_id: workerId,
        name: "AWS",
        issuer: "Amazon",
        link: "https://aws.amazon.com",
        issue_date: "2024-01-01",
        is_active: true,
      });

      expect(result.err).toBeInstanceOf(ConflictError);
    });
  });

  describe("Validation — date format", () => {
    it("[BUG-CE-005] addCertification schema should reject invalid issue_date format", () => {
      const { error } = commandModel.addCertification.validate({
        worker_id: workerId,
        name: "AWS",
        issuer: "Amazon",
        link: "https://aws.amazon.com",
        issue_date: "not-a-date",
        is_active: true,
      });
      expect(error).toBeDefined();
    });
  });

  describe("Business logic — link field updatable", () => {
    it("[BUG-CE-006] updateCertification should persist link changes", async () => {
      const domain = new CertificationCommandDomain({});
      domain.query = {
        findOne: jest.fn().mockResolvedValue({
          err: null,
          data: { id: certId, worker_id: workerId, link: "https://old.example.com" },
        }),
      };
      domain.command = {
        updateOneNew: jest.fn().mockResolvedValue({ err: null, data: true }),
      };

      const newLink = "https://new.example.com/cert";
      await domain.updateCertification({
        id: certId,
        worker_id: workerId,
        link: newLink,
      });

      expect(domain.command.updateOneNew).toHaveBeenCalledWith(
        { id: certId, worker_id: workerId },
        expect.objectContaining({ link: newLink })
      );
    });
  });

  describe("Security — delete lookup must include worker_id", () => {
    it("[BUG-CE-007] deleteCertification should find certification scoped to worker_id", async () => {
      const domain = new CertificationCommandDomain({});
      domain.query = {
        findOne: jest.fn().mockResolvedValue({ err: null, data: { id: certId } }),
      };
      domain.command = {
        deleteOne: jest.fn().mockResolvedValue({ err: null, data: true }),
      };

      await domain.deleteCertification({ id: certId, worker_id: workerId });

      expect(domain.query.findOne).toHaveBeenCalledWith(
        { id: certId, worker_id: workerId },
        expect.any(Object)
      );
    });
  });

  describe("Validation — delete schema requires worker_id", () => {
    it("[BUG-CE-008] deleteCertification schema should require worker_id", () => {
      const { error } = commandModel.deleteCertification.validate({ id: certId });
      expect(error).toBeDefined();
    });
  });
});
