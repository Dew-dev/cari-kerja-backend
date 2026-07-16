/**
 * QA Bug-Hunting Tests — educations
 * Tests assert CORRECT expected behavior. They FAIL while bugs remain in implementation.
 */
jest.mock("uuid", () => ({
  v4: jest.fn(() => "education-uuid-1234"),
}));

jest.mock("../../../src/modules/educations/repositories/commands/command_handler", () => ({
  insertEducations: jest.fn(),
  updateEducations: jest.fn(),
  deleteEducations: jest.fn(),
}));

const EducationsCommandDomain = require("../../../src/modules/educations/repositories/commands/domain");
const EducationsQueryDomain = require("../../../src/modules/educations/repositories/queries/domain");
const commandModel = require("../../../src/modules/educations/repositories/commands/command_model");
const {
  ForbiddenError,
} = require("../../../src/helpers/errors");

describe("[QA] educations module", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";
  const otherWorkerId = "550e8400-e29b-41d4-a716-446655440099";
  const educationId = "550e8400-e29b-41d4-a716-446655440010";

  describe("Security — IDOR on update", () => {
    it("[BUG-ED-001] updateOne should verify education belongs to worker_id before update", async () => {
      const domain = new EducationsCommandDomain({});
      domain.query = {
        findOne: jest.fn().mockResolvedValue({
          err: null,
          data: { id: educationId, worker_id: otherWorkerId },
        }),
      };
      domain.command = {
        updateOneNew: jest.fn().mockResolvedValue({ err: null, data: true }),
      };

      const result = await domain.updateOne({
        id: educationId,
        worker_id: workerId,
        institution_name: "Hacked University",
        degree: "PhD",
        start_date: "2020-01-01",
        is_current: false,
      });

      expect(domain.query.findOne).toHaveBeenCalledWith(
        { id: educationId, worker_id: workerId },
        expect.any(Object)
      );
      expect(result.err).toBeInstanceOf(ForbiddenError);
      expect(domain.command.updateOneNew).not.toHaveBeenCalled();
    });
  });

  describe("Validation — required fields on insert", () => {
    it("[BUG-ED-002] addEducations schema should require institution_name and degree", () => {
      const { error } = commandModel.addEducationsParamType.validate({
        worker_id: workerId,
        start_date: "2020-01-01",
      });
      expect(error).toBeDefined();
    });
  });

  describe("Query — empty list should not 404", () => {
    it("[BUG-ED-003] getAllEducationsByWorkerId should return empty array when worker has no educations", async () => {
      const domain = new EducationsQueryDomain({});
      domain.query = {
        getAllByWorkerId: jest.fn().mockResolvedValue({
          err: "Data Not Found Please Try Another Input",
          data: null,
        }),
      };

      const result = await domain.getAllEducationsByWorkerId({ worker_id: workerId });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
    });
  });

  describe("Business logic — is_current clears end_date on update", () => {
    it("[BUG-ED-004] updateOne should set end_date null when is_current is true", async () => {
      const domain = new EducationsCommandDomain({});
      domain.query = {
        findOne: jest.fn().mockResolvedValue({ err: null, data: { id: educationId } }),
      };
      domain.command = {
        updateOneNew: jest.fn().mockResolvedValue({ err: null, data: true }),
      };

      await domain.updateOne({
        id: educationId,
        worker_id: workerId,
        institution_name: "University",
        degree: "Bachelor",
        start_date: "2020-01-01",
        end_date: "2024-06-01",
        is_current: true,
      });

      expect(domain.command.updateOneNew).toHaveBeenCalledWith(
        { id: educationId, worker_id: workerId },
        expect.objectContaining({ is_current: true, end_date: null })
      );
    });
  });

  describe("Business logic — is_current on insert", () => {
    it("[BUG-ED-005] insertOne should ignore end_date when is_current is true", async () => {
      const domain = new EducationsCommandDomain({});
      domain.command = {
        insertOne: jest.fn().mockResolvedValue({
          err: null,
          data: { id: educationId },
        }),
      };
      domain.query = { findOne: jest.fn() };

      await domain.insertOne({
        worker_id: workerId,
        institution_name: "University",
        degree: "Bachelor",
        start_date: "2020-01-01",
        end_date: "2024-06-01",
        is_current: true,
      });

      expect(domain.command.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({ is_current: true, end_date: null })
      );
    });
  });

  describe("Validation — date format", () => {
    it("[BUG-ED-006] updateEducations schema should reject invalid start_date format", () => {
      const { error } = commandModel.updateEducationsParamType.validate({
        id: educationId,
        worker_id: workerId,
        institution_name: "University",
        degree: "Bachelor",
        start_date: "not-a-date",
        is_current: false,
      });
      expect(error).toBeDefined();
    });
  });

  describe("Security — update lookup must scope by worker", () => {
    it("[BUG-ED-007] updateOne findOne should include worker_id in lookup", async () => {
      const domain = new EducationsCommandDomain({});
      domain.query = {
        findOne: jest.fn().mockResolvedValue({ err: null, data: { id: educationId } }),
      };
      domain.command = {
        updateOneNew: jest.fn().mockResolvedValue({ err: null, data: true }),
      };

      await domain.updateOne({
        id: educationId,
        worker_id: workerId,
        institution_name: "University",
        degree: "Bachelor",
        start_date: "2020-01-01",
        is_current: false,
      });

      expect(domain.query.findOne).toHaveBeenCalledWith(
        { id: educationId, worker_id: workerId },
        expect.any(Object)
      );
    });
  });
});
