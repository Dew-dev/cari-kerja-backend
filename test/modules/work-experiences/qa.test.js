/**
 * QA Bug-Hunting Tests — work-experiences
 * Tests assert CORRECT expected behavior. They FAIL while bugs remain in implementation.
 */
jest.mock("uuid", () => ({
  v4: jest.fn(() => "work-exp-uuid-1234"),
}));

jest.mock("../../../src/modules/job_titles/helpers/resolve_job_title", () => ({
  resolveJobTitle: jest.fn().mockResolvedValue({
    id: "550e8400-e29b-41d4-a716-446655440099",
    name: "Engineer",
    slug: "engineer",
    category_id: 1,
  }),
  JobTitleResolveError: class JobTitleResolveError extends Error {
    constructor(message, code) {
      super(message);
      this.name = "JobTitleResolveError";
      this.code = code;
    }
  },
}));

jest.mock("../../../src/modules/work-experiences/repositories/commands/command_handler", () => ({
  insertWorkExperience: jest.fn(),
  updateWorkExperience: jest.fn(),
  deleteWorkExperience: jest.fn(),
}));

const WorkExpCommandDomain = require("../../../src/modules/work-experiences/repositories/commands/domain");
const commandModel = require("../../../src/modules/work-experiences/repositories/commands/command_model");
const apiHandler = require("../../../src/modules/work-experiences/handlers/api_handler");
const commandHandler = require("../../../src/modules/work-experiences/repositories/commands/command_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");
const { BadRequestError, NotFoundError } = require("../../../src/helpers/errors");

describe("[QA] work-experiences module", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";
  const expId = "550e8400-e29b-41d4-a716-446655440001";

  describe("Security — IDOR on delete", () => {
    let domain;
    let mockCommand;
    let mockQuery;

    beforeEach(() => {
      domain = new WorkExpCommandDomain({});
      mockCommand = {
        insertOne: jest.fn(),
        updateOneNew: jest.fn(),
        deleteOne: jest.fn().mockResolvedValue({ err: null, data: true }),
      };
      mockQuery = {
        findOne: jest.fn().mockResolvedValue({ err: null, data: { id: expId } }),
      };
      domain.command = mockCommand;
      domain.query = mockQuery;
    });

    it("[BUG-WE-001] deleteOne should scope delete by worker_id", async () => {
      await domain.deleteOne({ id: expId, worker_id: workerId });

      expect(mockCommand.deleteOne).toHaveBeenCalledWith({ id: expId, worker_id: workerId });
    });

    it("[BUG-WE-002] delete handler should pass worker_id from token", async () => {
      const res = createMockResponse();
      const req = createMockRequest({
        userMeta: { worker_id: workerId },
        params: { id: expId },
      });

      commandHandler.deleteWorkExperience.mockResolvedValue(wrapper.data("Successfully deleted"));

      await apiHandler.deleteWorkExperience(req, res);

      expect(commandHandler.deleteWorkExperience).toHaveBeenCalledWith({
        id: expId,
        worker_id: workerId,
      });
    });

    it("[BUG-WE-003] delete schema should require worker_id", () => {
      const { error: missingWorker } = commandModel.deleteWorkExperienceParamType.validate({
        id: expId,
      });
      expect(missingWorker).toBeDefined();
    });
  });

  describe("Validation — required fields on insert", () => {
    it("[BUG-WE-004] insert schema should reject null company_name job_title start_date", () => {
      const { error } = commandModel.addWorkExperienceParamType.validate({
        worker_id: workerId,
        company_name: null,
        job_title: null,
        start_date: null,
      });
      expect(error).toBeDefined();
    });
  });

  describe("Business logic — is_current clears end_date", () => {
    let domain;
    let mockCommand;

    beforeEach(() => {
      domain = new WorkExpCommandDomain({});
      mockCommand = {
        insertOne: jest.fn().mockResolvedValue({ err: null, data: { id: expId } }),
      };
      domain.command = mockCommand;
      domain.query = { findOne: jest.fn() };
    });

    it("[BUG-WE-005] insert should set end_date null when is_current is true", async () => {
      await domain.insertOne({
        worker_id: workerId,
        company_name: "Acme",
        job_title: "Engineer",
        category_id: 1,
        start_date: "2020-01-01",
        end_date: "2024-06-01",
        is_current: true,
      });

      expect(mockCommand.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          is_current: true,
          end_date: null,
        })
      );
    });

    it("[BUG-WE-006] update should set end_date null when is_current is true", async () => {
      domain.command.updateOneNew = jest.fn().mockResolvedValue({ err: null, data: true });
      domain.query.findOne = jest.fn().mockResolvedValue({
        err: null,
        data: { id: expId, worker_id: workerId },
      });

      await domain.updateOne({
        id: expId,
        worker_id: workerId,
        company_name: "Acme",
        job_title: "Engineer",
        category_id: 1,
        start_date: "2020-01-01",
        end_date: "2024-06-01",
        is_current: true,
      });

      expect(domain.command.updateOneNew).toHaveBeenCalledWith(
        { id: expId, worker_id: workerId },
        expect.objectContaining({
          is_current: true,
          end_date: null,
        })
      );
    });
  });

  describe("Security — update ownership check", () => {
    it("[BUG-WE-007] update should verify record belongs to worker_id before updating", async () => {
      const domain = new WorkExpCommandDomain({});
      const otherWorkerId = "550e8400-e29b-41d4-a716-446655440099";

      domain.query = {
        findOne: jest.fn().mockResolvedValue({
          err: null,
          data: { id: expId, worker_id: otherWorkerId },
        }),
      };
      domain.command = {
        updateOneNew: jest.fn().mockResolvedValue({ err: null, data: true }),
      };

      const result = await domain.updateOne({
        id: expId,
        worker_id: workerId,
        company_name: "Hacked Co",
        job_title: "Hacker",
        category_id: 1,
        start_date: "2020-01-01",
        is_current: false,
      });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(domain.command.updateOneNew).not.toHaveBeenCalled();
    });
  });

  describe("Input validation — invalid date strings", () => {
    it("[BUG-WE-008] insert schema should reject invalid date format", () => {
      const { error } = commandModel.addWorkExperienceParamType.validate({
        worker_id: workerId,
        company_name: "Acme",
        job_title: "Dev",
        start_date: "not-a-date",
      });
      expect(error).toBeDefined();
    });
  });

  describe("UI draft fields — strip _pending before validation", () => {
    const validBody = {
      company_name: "Acme",
      job_title: "Engineer",
      category_id: 1,
      start_date: "2020-01-01",
      end_date: null,
      is_current: true,
      description: null,
    };

    it("[BUG-WE-009] insert handler should strip _pending from payload", async () => {
      const res = createMockResponse();
      const req = createMockRequest({
        userMeta: { worker_id: workerId },
        body: { ...validBody, _pending: true },
      });
      commandHandler.insertWorkExperience.mockResolvedValue(wrapper.data({ id: expId }));

      await apiHandler.insertWorkExperience(req, res);

      expect(commandHandler.insertWorkExperience).toHaveBeenCalledWith({
        worker_id: workerId,
        ...validBody,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("[BUG-WE-010] update handler should strip _pending from payload", async () => {
      const res = createMockResponse();
      const req = createMockRequest({
        userMeta: { worker_id: workerId },
        params: { id: expId },
        body: { ...validBody, _pending: true },
      });
      commandHandler.updateWorkExperience.mockResolvedValue(wrapper.data({ id: expId }));

      await apiHandler.updateWorkExperience(req, res);

      expect(commandHandler.updateWorkExperience).toHaveBeenCalledWith({
        id: expId,
        worker_id: workerId,
        ...validBody,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
