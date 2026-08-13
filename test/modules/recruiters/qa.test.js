/**
 * QA Bug-Hunting Tests — recruiters
 */
jest.mock("../../../src/modules/recruiters/repositories/commands/command_handler", () => ({
  updateOneRecruiter: jest.fn(),
  updateRecruiterVip: jest.fn(),
}));

const RecruitersCommandDomain = require("../../../src/modules/recruiters/repositories/commands/domain");
const RecruitersQueryDomain = require("../../../src/modules/recruiters/repositories/queries/domain");
const apiHandler = require("../../../src/modules/recruiters/handlers/api_handler");
const commandHandler = require("../../../src/modules/recruiters/repositories/commands/command_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");
const { ForbiddenError } = require("../../../src/helpers/errors");

describe("[QA] recruiters module", () => {
  const userId = "550e8400-e29b-41d4-a716-446655440000";
  const otherUserId = "550e8400-e29b-41d4-a716-446655440099";
  const recruiterId = "550e8400-e29b-41d4-a716-446655440010";

  describe("Security — IDOR on update", () => {
    it("[BUG-RC-001] updateOneRecruiter should verify user_id owns recruiter profile", async () => {
      const domain = new RecruitersCommandDomain({});
      domain.query = {
        findOne: jest.fn().mockResolvedValue({
          err: null,
          data: { id: recruiterId, user_id: otherUserId },
        }),
      };
      domain.command = {
        updateOneNew: jest.fn().mockResolvedValue({ err: null, data: true }),
      };

      const result = await domain.updateOneRecruiter({
        id: recruiterId,
        user_id: userId,
        company_name: "Hacked Corp",
      });

      expect(result.err).toBeInstanceOf(ForbiddenError);
      expect(domain.command.updateOneNew).not.toHaveBeenCalled();
    });
  });

  describe("Security — recruiter profile by user_id", () => {
    it("[BUG-RC-002] GET /users/:user_id/recruiters is public (guest/worker may view company profile)", () => {
      let getMiddlewares = [];
      let putMiddlewares = [];

      const mockServer = {
        get: jest.fn((path, ...handlers) => {
          if (path === "/api/v1/users/:user_id/recruiters") {
            getMiddlewares = handlers.slice(0, -1);
          }
        }),
        put: jest.fn((path, ...handlers) => {
          if (path === "/api/v1/users/:user_id/recruiters/:id") {
            putMiddlewares = handlers.slice(0, -1);
          }
        }),
        patch: jest.fn(),
      };

      jest.isolateModules(() => {
        require("../../../src/routes/recruiters")(mockServer);
      });

      const getNames = getMiddlewares.map((fn) => fn.name || String(fn));
      expect(getNames.some((name) => /verify|auth|token/i.test(name))).toBe(false);

      const putNames = putMiddlewares.map((fn) => fn.name || String(fn));
      expect(putNames.some((name) => /verify|auth|token/i.test(name))).toBe(true);
    });
  });

  describe("Query — empty companies list", () => {
    it("[BUG-RC-003] getAllCompanies should return empty paginated list not NotFoundError", async () => {
      const domain = new RecruitersQueryDomain({});
      domain.query = {
        findAllCompanies: jest.fn().mockResolvedValue({
          err: "Data Not Found",
          data: null,
        }),
        countAll: jest.fn().mockResolvedValue({ err: null, data: 0 }),
      };

      const result = await domain.getAllCompanies({ page: 1, limit: 10, search: "" });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
    });
  });

  describe("Security — VIP self-update requires admin", () => {
    it("[BUG-RC-004] PATCH /users/recruiters/vip should require admin role middleware", () => {
      let middlewares = [];

      const mockServer = {
        get: jest.fn(),
        put: jest.fn(),
        patch: jest.fn((path, ...handlers) => {
          if (path === "/api/v1/users/recruiters/vip") {
            middlewares = handlers.slice(0, -1);
          }
        }),
      };

      jest.isolateModules(() => {
        require("../../../src/routes/recruiters")(mockServer);
      });

      const middlewareNames = middlewares.map((fn) => fn.name || String(fn));
      expect(middlewareNames.some((name) => /admin|role/i.test(name))).toBe(true);
    });
  });

  describe("Security — IDOR on update handler", () => {
    it("[BUG-RC-005] updateOneRecruiter handler should reject when user_id param differs from token", async () => {
      const res = createMockResponse();
      const req = createMockRequest({
        userMeta: { id: userId, recruiter_id: recruiterId },
        params: { user_id: otherUserId, id: recruiterId },
        body: { company_name: "Legitimate Update Corp" },
      });

      commandHandler.updateOneRecruiter.mockResolvedValue(wrapper.data({ id: recruiterId }));

      await apiHandler.updateOneRecruiter(req, res);

      expect(commandHandler.updateOneRecruiter).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
