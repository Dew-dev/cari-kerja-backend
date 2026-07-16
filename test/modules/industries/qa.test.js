/**
 * QA Bug-Hunting Tests — industries
 * Tests assert CORRECT expected behavior. They FAIL while bugs remain in implementation.
 */
jest.mock("../../../src/modules/industries/repositories/commands/command_handler", () => ({
  addIndustry: jest.fn(),
  updateIndustry: jest.fn(),
  deleteIndustry: jest.fn(),
}));

const IndustryCommandDomain = require("../../../src/modules/industries/repositories/commands/domain");
const IndustryQueryDomain = require("../../../src/modules/industries/repositories/queries/domain");
const commandModel = require("../../../src/modules/industries/repositories/commands/command_model");
const {
  ConflictError,
  InternalServerError,
} = require("../../../src/helpers/errors");

describe("[QA] industries module", () => {
  describe("Query — empty list should paginate not 404", () => {
    it("[BUG-IN-001] getAllIndustries should return empty array when no records match", async () => {
      const domain = new IndustryQueryDomain({});
      domain.query = {
        findAllIndustries: jest.fn().mockResolvedValue({
          err: "Data Not Found Please Try Another Input",
          data: null,
        }),
        countAllIndustries: jest.fn().mockResolvedValue({ err: null, data: 0 }),
      };

      const result = await domain.getAllIndustries({ page: 1, limit: 10, search: "none" });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
      expect(result.meta.total_data).toBe(0);
    });
  });

  describe("Security — mutating routes require admin auth", () => {
    it("[BUG-IN-002] POST /industries route should require admin authentication middleware", () => {
      let middlewares = [];

      const mockServer = {
        get: jest.fn(),
        post: jest.fn((path, ...handlers) => {
          if (path === "/api/v1/industries") {
            middlewares = handlers.slice(0, -1);
          }
        }),
        put: jest.fn(),
        delete: jest.fn(),
      };

      jest.isolateModules(() => {
        require("../../../src/routes/industries")(mockServer);
      });

      expect(middlewares.length).toBeGreaterThan(0);
      const middlewareNames = middlewares.map((fn) => fn.name || String(fn));
      expect(middlewareNames.some((name) => /verify|admin|auth|token/i.test(name))).toBe(true);
    });
  });

  describe("Business logic — duplicate industry name", () => {
    it("[BUG-IN-003] addIndustry should return ConflictError on duplicate name", async () => {
      const domain = new IndustryCommandDomain({});
      domain.command = {
        insertOne: jest.fn().mockResolvedValue({
          err: new Error("duplicate key value violates unique constraint"),
          data: null,
        }),
      };
      domain.query = { findOne: jest.fn() };

      const result = await domain.addIndustry({ name: "Technology" });

      expect(result.err).toBeInstanceOf(ConflictError);
    });
  });

  describe("Query — count column alias mismatch", () => {
    it("[BUG-IN-004] countAllIndustries should read total column not count alias", async () => {
      const Query = require("../../../src/modules/industries/repositories/queries/query");
      const mockDb = {
        executeQuery: jest.fn().mockResolvedValue({
          rows: [{ total: "20" }],
        }),
      };
      const query = new Query(mockDb);

      const result = await query.countAllIndustries("");

      expect(result.err).toBeNull();
      expect(result.data).toBe(20);
    });
  });

  describe("Pagination — limit zero safety", () => {
    it("[BUG-IN-005] getAllIndustries meta should not produce Infinity when limit is 0", async () => {
      const domain = new IndustryQueryDomain({});
      domain.query = {
        findAllIndustries: jest.fn().mockResolvedValue({
          err: null,
          data: [{ id: 1, name: "Technology" }],
        }),
        countAllIndustries: jest.fn().mockResolvedValue({ err: null, data: 10 }),
      };

      const result = await domain.getAllIndustries({ page: 1, limit: 0, search: "" });

      expect(Number.isFinite(result.meta.total_pages)).toBe(true);
      expect(result.meta.total_pages).not.toBe(Infinity);
    });
  });

  describe("Query — count failure handling", () => {
    it("[BUG-IN-006] getAllIndustries should return error when count query fails", async () => {
      const domain = new IndustryQueryDomain({});
      domain.query = {
        findAllIndustries: jest.fn().mockResolvedValue({
          err: null,
          data: [{ id: 1, name: "Technology" }],
        }),
        countAllIndustries: jest.fn().mockResolvedValue({
          err: new Error("count failed"),
          data: null,
        }),
      };

      const result = await domain.getAllIndustries({ page: 1, limit: 10, search: "" });

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.meta).toBeUndefined();
    });
  });

  describe("Validation — blank industry name rejected", () => {
    it("[BUG-IN-007] addIndustry schema should reject whitespace-only name", () => {
      const { error } = commandModel.addIndustryType.validate({ name: "   " });
      expect(error).toBeDefined();
    });
  });
});
