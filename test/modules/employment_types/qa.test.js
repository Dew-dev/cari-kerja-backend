/**
 * QA Bug-Hunting Tests — employment_types
 * Tests assert CORRECT expected behavior. They FAIL while bugs remain in implementation.
 */
jest.mock("../../../src/modules/employment_types/repositories/commands/command_handler", () => ({
  addEmploymentType: jest.fn(),
  updateEmploymentType: jest.fn(),
  deleteEmploymentType: jest.fn(),
}));

const EmploymentTypesCommandDomain = require("../../../src/modules/employment_types/repositories/commands/domain");
const EmploymentTypesQueryDomain = require("../../../src/modules/employment_types/repositories/queries/domain");
const commandModel = require("../../../src/modules/employment_types/repositories/commands/command_model");
const {
  ConflictError,
  InternalServerError,
} = require("../../../src/helpers/errors");

describe("[QA] employment_types module", () => {
  describe("Query — empty list should paginate not 404", () => {
    it("[BUG-ET-001] getAllEmploymentTypes should return empty array when no records match", async () => {
      const domain = new EmploymentTypesQueryDomain({});
      domain.query = {
        findAllEmploymentTypes: jest.fn().mockResolvedValue({
          err: "Data Not Found Please Try Another Input",
          data: null,
        }),
        countAllEmploymentTypes: jest.fn().mockResolvedValue({
          err: null,
          data: { rows: [{ total: "0" }] },
        }),
      };

      const result = await domain.getAllEmploymentTypes({ page: 1, limit: 10, search: "none" });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
      expect(result.meta.total_data).toBe(0);
    });
  });

  describe("Security — mutating routes require admin auth", () => {
    it("[BUG-ET-002] POST /employment_types route should require admin authentication middleware", () => {
      let middlewares = [];

      const mockServer = {
        get: jest.fn(),
        post: jest.fn((path, ...handlers) => {
          if (path === "/api/v1/employment_types") {
            middlewares = handlers.slice(0, -1);
          }
        }),
        put: jest.fn(),
        delete: jest.fn(),
      };

      jest.isolateModules(() => {
        require("../../../src/routes/employment_types")(mockServer);
      });

      expect(middlewares.length).toBeGreaterThan(0);
      const middlewareNames = middlewares.map((fn) => fn.name || String(fn));
      expect(middlewareNames.some((name) => /verify|admin|auth|token/i.test(name))).toBe(true);
    });
  });

  describe("Business logic — duplicate name", () => {
    it("[BUG-ET-003] addEmploymentType should return ConflictError on duplicate name", async () => {
      const domain = new EmploymentTypesCommandDomain({});
      domain.command = {
        insertOne: jest.fn().mockResolvedValue({
          err: new Error("duplicate key value violates unique constraint"),
          data: null,
        }),
      };
      domain.query = { findOne: jest.fn() };

      const result = await domain.addEmploymentType({ name: "Full Time" });

      expect(result.err).toBeInstanceOf(ConflictError);
    });
  });

  describe("Query — count failure handling", () => {
    it("[BUG-ET-004] getAllEmploymentTypes should return error when count query fails", async () => {
      const domain = new EmploymentTypesQueryDomain({});
      domain.query = {
        findAllEmploymentTypes: jest.fn().mockResolvedValue({
          err: null,
          data: [{ id: 1, name: "Full Time" }],
        }),
        countAllEmploymentTypes: jest.fn().mockResolvedValue({
          err: new Error("count failed"),
          data: null,
        }),
      };

      const result = await domain.getAllEmploymentTypes({ page: 1, limit: 10, search: "" });

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.meta).toBeUndefined();
    });
  });

  describe("Pagination — limit zero safety", () => {
    it("[BUG-ET-005] getAllEmploymentTypes meta should not produce Infinity when limit is 0", async () => {
      const domain = new EmploymentTypesQueryDomain({});
      domain.query = {
        findAllEmploymentTypes: jest.fn().mockResolvedValue({
          err: null,
          data: [{ id: 1, name: "Full Time" }],
        }),
        countAllEmploymentTypes: jest.fn().mockResolvedValue({
          err: null,
          data: { rows: [{ total: "10" }] },
        }),
      };

      const result = await domain.getAllEmploymentTypes({ page: 1, limit: 0, search: "" });

      expect(Number.isFinite(result.meta.total_pages)).toBe(true);
      expect(result.meta.total_pages).not.toBe(Infinity);
    });
  });

  describe("Validation — name max length", () => {
    it("[BUG-ET-006] addEmploymentType schema should enforce max length on name", () => {
      const { error } = commandModel.addEmploymentTypeType.validate({
        name: "a".repeat(256),
      });
      expect(error).toBeDefined();
    });
  });

  describe("Query — missing count rows safety", () => {
    it("[BUG-ET-007] getAllEmploymentTypes should handle empty count rows without throwing", async () => {
      const domain = new EmploymentTypesQueryDomain({});
      domain.query = {
        findAllEmploymentTypes: jest.fn().mockResolvedValue({
          err: null,
          data: [{ id: 1, name: "Full Time" }],
        }),
        countAllEmploymentTypes: jest.fn().mockResolvedValue({
          err: null,
          data: { rows: [] },
        }),
      };

      const result = await domain.getAllEmploymentTypes({ page: 1, limit: 10, search: "" });

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.meta).toBeUndefined();
    });
  });
});
