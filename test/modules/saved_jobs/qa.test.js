/**
 * QA Bug-Hunting Tests — saved_jobs
 * Tests assert CORRECT expected behavior. They FAIL while bugs remain in implementation.
 * Do NOT modify production code to make these pass without fixing the underlying bug.
 */
const SavedJobsCommandDomain = require("../../../src/modules/saved_jobs/repositories/commands/domain");
const SavedJobsQueryDomain = require("../../../src/modules/saved_jobs/repositories/queries/domain");
const savedJobsHandler = require("../../../src/modules/saved_jobs/handlers/api_handler");
const commandModel = require("../../../src/modules/saved_jobs/repositories/commands/command_model");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const {
  ForbiddenError,
  ConflictError,
  NotFoundError,
} = require("../../../src/helpers/errors");
const wrapper = require("../../../src/helpers/utils/wrapper");

jest.mock("../../../src/modules/saved_jobs/repositories/commands/command_handler", () => ({
  createSavedJob: jest.fn(),
  deleteSavedJob: jest.fn(),
}));

jest.mock("../../../src/modules/saved_jobs/repositories/queries/query_handler", () => ({
  getSavedJobsByWorkerId: jest.fn(),
  getSavedJobsById: jest.fn(),
  getSavedJobs: jest.fn(),
  getSavedJobsSelf: jest.fn(),
}));

const commandHandler = require("../../../src/modules/saved_jobs/repositories/commands/command_handler");

describe("[QA] saved_jobs module", () => {
  describe("Security — IDOR on delete", () => {
    let domain;
    let mockCommand;
    let mockQuery;

    beforeEach(() => {
      domain = new SavedJobsCommandDomain({});
      mockCommand = { insertOne: jest.fn(), deleteOne: jest.fn() };
      mockQuery = { findOne: jest.fn() };
      domain.command = mockCommand;
      domain.query = mockQuery;
    });

    it("[BUG-SJ-001] should reject delete when requester worker_id does not own the saved job", async () => {
      const savedJobId = "saved-job-uuid";
      const ownerWorkerId = "550e8400-e29b-41d4-a716-446655440000";
      const attackerWorkerId = "550e8400-e29b-41d4-a716-446655440099";

      mockQuery.findOne.mockResolvedValue({
        err: null,
        data: { id: savedJobId, worker_id: ownerWorkerId, job_post_id: "job-1" },
      });

      mockCommand.deleteOne.mockResolvedValue({ err: null, data: true });

      const result = await domain.deleteSavedJob({
        id: savedJobId,
        worker_id: attackerWorkerId,
      });

      expect(result.err).toBeInstanceOf(ForbiddenError);
      expect(mockCommand.deleteOne).not.toHaveBeenCalled();
    });

    it("[BUG-SJ-002] delete schema should require worker_id for ownership validation", () => {
      const { error: idOnlyError } = commandModel.deleteSavedJobParamType.validate({
        id: "550e8400-e29b-41d4-a716-446655440001",
      });

      expect(idOnlyError).toBeDefined();

      const { error: scopedError } = commandModel.deleteSavedJobParamType.validate({
        id: "550e8400-e29b-41d4-a716-446655440001",
        worker_id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(scopedError).toBeUndefined();
    });
  });

  describe("Security — handler does not scope delete to token worker", () => {
    it("[BUG-SJ-003] delete handler should pass worker_id from token to command", async () => {
      const workerId = "550e8400-e29b-41d4-a716-446655440000";
      const savedJobId = "550e8400-e29b-41d4-a716-446655440001";
      const res = createMockResponse();
      const req = createMockRequest({
        userMeta: { worker_id: workerId },
        params: { id: savedJobId },
      });

      commandHandler.deleteSavedJob.mockResolvedValue(wrapper.data("Success deleted Saved Job"));

      await savedJobsHandler.deleteJobPost(req, res);

      expect(commandHandler.deleteSavedJob).toHaveBeenCalledWith({
        id: savedJobId,
        worker_id: workerId,
      });
    });
  });

  describe("Security — list by worker_id without ownership check", () => {
    it("[BUG-SJ-004] getSavedJobsByWorkerId should reject when worker_id param differs from token", async () => {
      const tokenWorkerId = "550e8400-e29b-41d4-a716-446655440000";
      const otherWorkerId = "550e8400-e29b-41d4-a716-446655440099";
      const res = createMockResponse();
      const req = createMockRequest({
        userMeta: { worker_id: tokenWorkerId },
        params: { worker_id: otherWorkerId },
        query: {},
      });

      const queryHandler = require("../../../src/modules/saved_jobs/repositories/queries/query_handler");
      queryHandler.getSavedJobsByWorkerId.mockResolvedValue(wrapper.paginationData([], {
        page: 1, per_page: 10, total_data: 0, total_pages: 0,
      }));

      await savedJobsHandler.getSavedJobsByWorkerId(req, res);

      expect(queryHandler.getSavedJobsByWorkerId).not.toHaveBeenCalledWith(
        expect.objectContaining({ worker_id: otherWorkerId })
      );
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("Routing — self endpoint must scope to authenticated worker", () => {
    it("[BUG-SJ-005] /workers/saved-jobs/self route should use getSavedJobsSelf handler", () => {
      let selfRouteHandler;
      let isolatedApiHandler;

      const mockServer = {
        get: jest.fn((path, ...handlers) => {
          if (path === "/api/v1/workers/saved-jobs/self") {
            selfRouteHandler = handlers[handlers.length - 1];
          }
        }),
        post: jest.fn(),
        delete: jest.fn(),
      };

      // Resolve apiHandler from the same isolated registry used by the route file,
      // otherwise reference equality would fail even for a correctly wired route.
      jest.isolateModules(() => {
        jest.doMock("../../../src/middlewares/verifyToken", () => jest.fn());
        isolatedApiHandler = require("../../../src/modules/saved_jobs/handlers/api_handler");
        require("../../../src/routes/saved_jobs")(mockServer);
      });

      expect(selfRouteHandler).toBe(isolatedApiHandler.getSavedJobsSelf);
    });
  });

  describe("Business logic — duplicate save", () => {
    let domain;

    beforeEach(() => {
      domain = new SavedJobsCommandDomain({});
      domain.command = {
        insertOne: jest.fn().mockResolvedValue({
          err: new Error("duplicate key value violates unique constraint"),
          data: null,
        }),
      };
      domain.query = { findOne: jest.fn() };
    });

    it("[BUG-SJ-006] duplicate save should return ConflictError not InternalServerError", async () => {
      const result = await domain.createSavedJob({
        job_post_id: "job-uuid",
        worker_id: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(result.err).toBeInstanceOf(ConflictError);
      expect(result.err).not.toBeInstanceOf(require("../../../src/helpers/errors").InternalServerError);
    });
  });

  describe("Query filters — employment_type without status", () => {
    let domain;
    let mockQuery;

    beforeEach(() => {
      domain = new SavedJobsQueryDomain({});
      mockQuery = {
        findAll: jest.fn().mockResolvedValue({
          err: null,
          data: [],
          meta: { page: 1, limit: 10, total: 0, totalPage: 0 },
        }),
        findAllByWorkerId: jest.fn().mockResolvedValue({
          err: null,
          data: [],
          meta: { page: 1, limit: 10, total: 0, totalPage: 0 },
        }),
        findAllSelf: jest.fn().mockResolvedValue({
          err: null,
          data: [],
          meta: { page: 1, limit: 10, total: 0, totalPage: 0 },
        }),
      };
      domain.query = mockQuery;
    });

    it("[BUG-SJ-007] getSavedJobs should apply employment_type filter without requiring status", async () => {
      await domain.getSavedJobs({
        employment_type: "Full-time",
        status: "",
        page: 1,
        limit: 10,
      });

      const callArg = mockQuery.findAll.mock.calls[0][0];
      const values = callArg.values;
      expect(values).toContain("Full-time");
    });

    it("[BUG-SJ-008] getSavedJobsSelf should apply employment_type filter without requiring status", async () => {
      const domain = new SavedJobsQueryDomain({});
      domain.query = {
        findAll: jest.fn().mockResolvedValue({
          err: null,
          data: [],
          meta: { page: 1, limit: 10, total: 0, totalPage: 0 },
        }),
      };

      await domain.getSavedJobsSelf({
        worker_id: "550e8400-e29b-41d4-a716-446655440000",
        employment_type: "Contract",
        status: "",
        page: 1,
        limit: 10,
      });

      const values = domain.query.findAll.mock.calls[0][0].values;
      expect(values).toContain("Contract");
    });
  });

  describe("Query filters — location wildcard consistency", () => {
    it("[BUG-SJ-009] getSavedJobs location filter should wrap search term with wildcards", async () => {
      const domain = new SavedJobsQueryDomain({});
      domain.query = {
        findAll: jest.fn().mockResolvedValue({
          err: null,
          data: [],
          meta: { page: 1, limit: 10, total: 0, totalPage: 0 },
        }),
      };

      await domain.getSavedJobs({ location: "Jakarta", page: 1, limit: 10 });

      const values = domain.query.findAll.mock.calls[0][0].values;
      expect(values.some((v) => typeof v === "string" && v.includes("%Jakarta%"))).toBe(true);
    });
  });
});
