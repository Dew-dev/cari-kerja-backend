/**
 * QA Bug-Hunting Tests — genders
 * Tests assert CORRECT expected behavior. They FAIL while bugs remain in implementation.
 */
jest.mock("../../../src/modules/genders/repositories/commands/command_handler", () => ({
  addGender: jest.fn(),
  updateGender: jest.fn(),
  deleteGender: jest.fn(),
}));

const GendersCommandDomain = require("../../../src/modules/genders/repositories/commands/domain");
const GendersQueryDomain = require("../../../src/modules/genders/repositories/queries/domain");
const commandModel = require("../../../src/modules/genders/repositories/commands/command_model");
const {
  ConflictError,
  InternalServerError,
} = require("../../../src/helpers/errors");

describe("[QA] genders module", () => {
  describe("Query — empty list should paginate not 404", () => {
    it("[BUG-GE-001] getAllGenders should return empty array when no records match", async () => {
      const domain = new GendersQueryDomain({});
      domain.query = {
        findAllGenders: jest.fn().mockResolvedValue({
          err: "Data Not Found Please Try Another Input",
          data: null,
        }),
        countAllGenders: jest.fn().mockResolvedValue({ err: null, data: 0 }),
      };

      const result = await domain.getAllGenders({ page: 1, limit: 10, search: "none" });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
      expect(result.meta.total_data).toBe(0);
    });
  });

  describe("Security — mutating routes require admin auth", () => {
    it("[BUG-GE-002] POST /genders route should require admin authentication middleware", () => {
      let middlewares = [];

      const mockServer = {
        get: jest.fn(),
        post: jest.fn((path, ...handlers) => {
          if (path === "/api/v1/genders") {
            middlewares = handlers.slice(0, -1);
          }
        }),
        put: jest.fn(),
        delete: jest.fn(),
      };

      jest.isolateModules(() => {
        require("../../../src/routes/genders")(mockServer);
      });

      expect(middlewares.length).toBeGreaterThan(0);
      const middlewareNames = middlewares.map((fn) => fn.name || String(fn));
      expect(middlewareNames.some((name) => /verify|admin|auth|token/i.test(name))).toBe(true);
    });
  });

  describe("Business logic — duplicate gender name", () => {
    it("[BUG-GE-003] addGender should return ConflictError on duplicate gender_name", async () => {
      const domain = new GendersCommandDomain({});
      domain.command = {
        insertOne: jest.fn().mockResolvedValue({
          err: new Error("duplicate key value violates unique constraint"),
          data: null,
        }),
      };
      domain.query = { findOne: jest.fn() };

      const result = await domain.addGender({ gender_name: "Male" });

      expect(result.err).toBeInstanceOf(ConflictError);
    });
  });

  describe("Query — count column alias mismatch", () => {
    it("[BUG-GE-004] countAllGenders should read total column not count alias", async () => {
      const Query = require("../../../src/modules/genders/repositories/queries/query");
      const mockDb = {
        executeQuery: jest.fn().mockResolvedValue({
          rows: [{ total: "15" }],
        }),
      };
      const query = new Query(mockDb);

      const result = await query.countAllGenders("");

      expect(result.err).toBeNull();
      expect(result.data).toBe(15);
    });
  });

  describe("Pagination — limit zero safety", () => {
    it("[BUG-GE-005] getAllGenders meta should not produce Infinity when limit is 0", async () => {
      const domain = new GendersQueryDomain({});
      domain.query = {
        findAllGenders: jest.fn().mockResolvedValue({
          err: null,
          data: [{ id: 1, gender_name: "Male" }],
        }),
        countAllGenders: jest.fn().mockResolvedValue({ err: null, data: 10 }),
      };

      const result = await domain.getAllGenders({ page: 1, limit: 0, search: "" });

      expect(Number.isFinite(result.meta.total_pages)).toBe(true);
      expect(result.meta.total_pages).not.toBe(Infinity);
    });
  });

  describe("Query — count failure handling", () => {
    it("[BUG-GE-006] getAllGenders should return error when count query fails", async () => {
      const domain = new GendersQueryDomain({});
      domain.query = {
        findAllGenders: jest.fn().mockResolvedValue({
          err: null,
          data: [{ id: 1, gender_name: "Male" }],
        }),
        countAllGenders: jest.fn().mockResolvedValue({
          err: new Error("count failed"),
          data: null,
        }),
      };

      const result = await domain.getAllGenders({ page: 1, limit: 10, search: "" });

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.meta).toBeUndefined();
    });
  });

  describe("Validation — gender_name max length", () => {
    it("[BUG-GE-007] addGender schema should enforce max length on gender_name", () => {
      const { error } = commandModel.addGenderType.validate({
        gender_name: "a".repeat(256),
      });
      expect(error).toBeDefined();
    });
  });
});
