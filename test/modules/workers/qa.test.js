/**
 * QA Bug-Hunting Tests — workers
 * Tests assert CORRECT expected behavior. They FAIL while bugs remain in implementation.
 */
jest.mock("../../../src/modules/workers/repositories/commands/command_handler", () => ({
  updateOneWorker: jest.fn(),
}));

const WorkersCommandDomain = require("../../../src/modules/workers/repositories/commands/domain");
const WorkersQueryDomain = require("../../../src/modules/workers/repositories/queries/domain");
const commandModel = require("../../../src/modules/workers/repositories/commands/command_model");
const apiHandler = require("../../../src/modules/workers/handlers/api_handler");
const commandHandler = require("../../../src/modules/workers/repositories/commands/command_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");
const { NotFoundError, ForbiddenError } = require("../../../src/helpers/errors");

describe("[QA] workers module", () => {
  const userId = "550e8400-e29b-41d4-a716-446655440000";
  const workerId = "550e8400-e29b-41d4-a716-446655440001";
  const otherUserId = "550e8400-e29b-41d4-a716-446655440099";

  describe("Concurrency / async — missing await on existence check", () => {
    it("[BUG-WK-001] updateOneWorker should await worker lookup before updating", async () => {
      const domain = new WorkersCommandDomain({});
      domain.query = {
        findOne: jest.fn().mockResolvedValue({ err: new Error("not found"), data: null }),
      };
      domain.command = {
        updateOneNew: jest.fn().mockResolvedValue({ err: null, data: true }),
      };

      const result = await domain.updateOneWorker({
        id: workerId,
        user_id: userId,
        profile_summary: "Updated summary with enough content for validation purposes here.",
        telephone: "08123456789",
      });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(domain.command.updateOneNew).not.toHaveBeenCalled();
    });
  });

  describe("Security — IDOR on update", () => {
    it("[BUG-WK-002] updateOneWorker handler should reject when user_id param differs from token", async () => {
      const res = createMockResponse();
      const req = createMockRequest({
        userMeta: { id: userId, worker_id: workerId },
        params: { user_id: otherUserId, id: workerId },
        body: {
          profile_summary: "Legitimate update text that meets minimum validation requirements.",
          telephone: "08111111111",
        },
      });

      commandHandler.updateOneWorker.mockResolvedValue(wrapper.data({ id: workerId }));

      await apiHandler.updateOneWorker(req, res);

      expect(commandHandler.updateOneWorker).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("File upload — admin update route drops avatar", () => {
    it("[BUG-WK-003] updateOneWorker should include avatar_url from uploaded file in validated payload", async () => {
      const res = createMockResponse();
      const req = createMockRequest({
        params: { user_id: userId, id: workerId },
        body: {
          profile_summary: "Profile summary text long enough to satisfy validation rules here.",
        },
        file: { filename: "avatar.png" },
      });

      commandHandler.updateOneWorker.mockResolvedValue(wrapper.data({ id: workerId }));

      await apiHandler.updateOneWorker(req, res);

      expect(commandHandler.updateOneWorker).toHaveBeenCalledWith(
        expect.objectContaining({
          avatar_url: "/uploads/avatars/worker/avatar.png",
        })
      );
    });
  });

  describe("Validation — partial self update", () => {
    it("[BUG-WK-004] updateWorker schema should allow partial update without profile_summary", () => {
      const { error } = commandModel.updateWorkerParamType.validate({
        id: workerId,
        user_id: userId,
        telephone: "08123456789",
      });
      expect(error).toBeUndefined();
    });
  });

  describe("Pagination — invalid page/limit bounds", () => {
    it("[BUG-WK-005] getWorkers query model should reject limit=0", () => {
      const queryModel = require("../../../src/modules/workers/repositories/queries/query_model");
      const { error } = queryModel.getWorkersParamType.validate({ page: 1, limit: 0 });
      expect(error).toBeDefined();
    });

    it("[BUG-WK-006] getWorkers query model should reject negative page values", () => {
      const queryModel = require("../../../src/modules/workers/repositories/queries/query_model");
      const { error } = queryModel.getWorkersParamType.validate({ page: -1, limit: 10 });
      expect(error).toBeDefined();
    });
  });

  describe("Data integrity — soft-deleted workers", () => {
    it("[BUG-WK-007] getWorkers query should exclude workers with deleted_at set", async () => {
      const domain = new WorkersQueryDomain({});
      let capturedPayload = null;
      domain.query = {
        countAllWorkers: jest.fn().mockResolvedValue({ err: null, data: { rowCount: 0 } }),
        findAll: jest.fn().mockImplementation((payload) => {
          capturedPayload = payload;
          return Promise.resolve({
            err: null,
            data: [],
            meta: { page: 1, limit: 12, total_data: 0, total_pages: 0 },
          });
        }),
      };

      await domain.getWorkers({ page: 1, limit: 12, search: "" });

      expect(String(capturedPayload?.conditions).toLowerCase()).toMatch(/deleted_at\s+is\s+null/);
    });
  });
});
