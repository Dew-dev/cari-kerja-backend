/**
 * QA Bug-Hunting Tests — experience_levels
 * Tests assert CORRECT expected behavior. They FAIL while bugs remain in implementation.
 */
jest.mock("../../../src/modules/experience_levels/repositories/commands/command_handler", () => ({
  addExperienceLevel: jest.fn(),
  updateExperienceLevel: jest.fn(),
  deleteExperienceLevel: jest.fn(),
}));

const ExperienceLevelsCommandDomain = require("../../../src/modules/experience_levels/repositories/commands/domain");
const ExperienceLevelsQueryDomain = require("../../../src/modules/experience_levels/repositories/queries/domain");
const commandModel = require("../../../src/modules/experience_levels/repositories/commands/command_model");
const {
  ConflictError,
  InternalServerError,
} = require("../../../src/helpers/errors");

describe("[QA] experience_levels module", () => {
  describe("Query — empty list should paginate not 404", () => {
    it("[BUG-EL-001] getAllExperienceLevels should return empty array when no records match", async () => {
      const domain = new ExperienceLevelsQueryDomain({});
      domain.query = {
        findAllExperienceLevels: jest.fn().mockResolvedValue({
          err: "Data Not Found Please Try Another Input",
          data: null,
        }),
        countAllExperienceLevels: jest.fn().mockResolvedValue({
          err: null,
          data: { rows: [{ total: "0" }] },
        }),
      };

      const result = await domain.getAllExperienceLevels({ page: 1, limit: 10, search: "none" });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
      expect(result.meta.total_data).toBe(0);
    });
  });

  describe("Security — mutating routes require admin auth", () => {
    it("[BUG-EL-002] POST /experience_levels route should require admin authentication middleware", () => {
      let middlewares = [];

      const mockServer = {
        get: jest.fn(),
        post: jest.fn((path, ...handlers) => {
          if (path === "/api/v1/experience_levels") {
            middlewares = handlers.slice(0, -1);
          }
        }),
        put: jest.fn(),
        delete: jest.fn(),
      };

      jest.isolateModules(() => {
        require("../../../src/routes/experience_levels")(mockServer);
      });

      expect(middlewares.length).toBeGreaterThan(0);
      const middlewareNames = middlewares.map((fn) => fn.name || String(fn));
      expect(middlewareNames.some((name) => /verify|admin|auth|token/i.test(name))).toBe(true);
    });
  });

  describe("Business logic — duplicate name", () => {
    it("[BUG-EL-003] addExperienceLevel should return ConflictError on duplicate name", async () => {
      const domain = new ExperienceLevelsCommandDomain({});
      domain.command = {
        insertOne: jest.fn().mockResolvedValue({
          err: new Error("duplicate key value violates unique constraint"),
          data: null,
        }),
      };
      domain.query = { findOne: jest.fn() };

      const result = await domain.addExperienceLevel({ name: "Senior" });

      expect(result.err).toBeInstanceOf(ConflictError);
    });
  });

  describe("Query — count failure handling", () => {
    it("[BUG-EL-004] getAllExperienceLevels should return error when count query fails", async () => {
      const domain = new ExperienceLevelsQueryDomain({});
      domain.query = {
        findAllExperienceLevels: jest.fn().mockResolvedValue({
          err: null,
          data: [{ id: 1, name: "Senior" }],
        }),
        countAllExperienceLevels: jest.fn().mockResolvedValue({
          err: new Error("count failed"),
          data: null,
        }),
      };

      const result = await domain.getAllExperienceLevels({ page: 1, limit: 10, search: "" });

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.meta).toBeUndefined();
    });
  });

  describe("Pagination — limit zero safety", () => {
    it("[BUG-EL-005] getAllExperienceLevels meta should not produce Infinity when limit is 0", async () => {
      const domain = new ExperienceLevelsQueryDomain({});
      domain.query = {
        findAllExperienceLevels: jest.fn().mockResolvedValue({
          err: null,
          data: [{ id: 1, name: "Senior" }],
        }),
        countAllExperienceLevels: jest.fn().mockResolvedValue({
          err: null,
          data: { rows: [{ total: "10" }] },
        }),
      };

      const result = await domain.getAllExperienceLevels({ page: 1, limit: 0, search: "" });

      expect(Number.isFinite(result.meta.total_pages)).toBe(true);
      expect(result.meta.total_pages).not.toBe(Infinity);
    });
  });

  describe("Validation — blank name rejected", () => {
    it("[BUG-EL-006] addExperienceLevel schema should reject whitespace-only name", () => {
      const { error } = commandModel.addExperienceLevelType.validate({ name: "   " });
      expect(error).toBeDefined();
    });
  });

  describe("Query — missing count rows safety", () => {
    it("[BUG-EL-007] getAllExperienceLevels should handle empty count rows without throwing", async () => {
      const domain = new ExperienceLevelsQueryDomain({});
      domain.query = {
        findAllExperienceLevels: jest.fn().mockResolvedValue({
          err: null,
          data: [{ id: 1, name: "Senior" }],
        }),
        countAllExperienceLevels: jest.fn().mockResolvedValue({
          err: null,
          data: { rows: [] },
        }),
      };

      const result = await domain.getAllExperienceLevels({ page: 1, limit: 10, search: "" });

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.meta).toBeUndefined();
    });
  });
});
