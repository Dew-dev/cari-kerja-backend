/**
 * QA Bug-Hunting Tests — resumes
 */
jest.mock("uuid", () => ({
  v4: jest.fn(() => "resume-uuid-1234"),
}));

jest.mock("../../../src/modules/resumes/repositories/commands/command_handler", () => ({
  deleteResume: jest.fn(),
}));

const ResumesCommandDomain = require("../../../src/modules/resumes/repositories/commands/domain");
const ResumesQueryDomain = require("../../../src/modules/resumes/repositories/queries/domain");
const apiHandler = require("../../../src/modules/resumes/handlers/api_handler");
const commandHandler = require("../../../src/modules/resumes/repositories/commands/command_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");
const { ForbiddenError, NotFoundError } = require("../../../src/helpers/errors");

describe("[QA] resumes module", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";
  const otherWorkerId = "550e8400-e29b-41d4-a716-446655440099";
  const resumeId = "550e8400-e29b-41d4-a716-446655440010";

  describe("Security — IDOR on update", () => {
    it("[BUG-RE-001] updateResume should scope update by worker_id", async () => {
      const domain = new ResumesCommandDomain({});
      domain.query = {
        findOne: jest.fn().mockResolvedValue({
          err: null,
          data: { id: resumeId, worker_id: otherWorkerId, is_default: false },
        }),
      };
      domain.command = {
        updateOneNew: jest.fn().mockResolvedValue({ err: null, data: true }),
      };

      const result = await domain.updateResume({
        id: resumeId,
        worker_id: workerId,
        title: "Hacked Resume",
      });

      expect(domain.command.updateOneNew).toHaveBeenCalledWith(
        { id: resumeId, worker_id: workerId },
        expect.any(Object)
      );
      expect(result.err).toBeInstanceOf(ForbiddenError);
    });
  });

  describe("Security — IDOR on delete", () => {
    it("[BUG-RE-002] deleteResume should verify resume belongs to worker", async () => {
      const domain = new ResumesCommandDomain({});
      domain.query = {
        findOne: jest.fn().mockResolvedValue({
          err: null,
          data: { id: resumeId, worker_id: otherWorkerId },
        }),
      };
      domain.command = {
        deleteOne: jest.fn().mockResolvedValue({ err: null, data: true }),
      };

      const result = await domain.deleteResume({ id: resumeId, worker_id: workerId });

      expect(result.err).toBeInstanceOf(ForbiddenError);
      expect(domain.command.deleteOne).not.toHaveBeenCalled();
    });
  });

  describe("Pagination — count scoped to worker", () => {
    it("[BUG-RE-003] getAllResumes meta total_data should count only worker resumes", async () => {
      const domain = new ResumesQueryDomain({});
      domain.query = {
        findAll: jest.fn().mockResolvedValue({
          err: null,
          data: [{ id: resumeId, worker_id: workerId, title: "CV 1" }],
        }),
        countAll: jest.fn().mockResolvedValue({ err: null, data: 50 }),
      };

      const result = await domain.getAllResumes({ worker_id: workerId, page: 1, limit: 10 });

      expect(result.meta.total_data).toBe(1);
    });
  });

  describe("Query — empty list", () => {
    it("[BUG-RE-004] getAllResumes should return empty paginated list not NotFoundError", async () => {
      const domain = new ResumesQueryDomain({});
      domain.query = {
        findAll: jest.fn().mockResolvedValue({
          err: "Data Not Found Please Try Another Input",
          data: null,
        }),
        countAll: jest.fn().mockResolvedValue({ err: null, data: 0 }),
      };

      const result = await domain.getAllResumes({ worker_id: workerId, page: 1, limit: 10 });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
    });
  });

  describe("Security — delete handler worker scope", () => {
    it("[BUG-RE-005] deleteResume handler should pass worker_id to command layer", async () => {
      const res = createMockResponse();
      const req = createMockRequest({
        userMeta: { worker_id: workerId },
        params: { id: resumeId },
      });

      commandHandler.deleteResume.mockResolvedValue(wrapper.data("Success deleted resume"));

      await apiHandler.deleteResume(req, res);

      expect(commandHandler.deleteResume).toHaveBeenCalledWith(
        expect.objectContaining({ id: resumeId, worker_id: workerId })
      );
    });
  });
});
