/**
 * QA Bug-Hunting Tests — categories
 * Tests assert CORRECT expected behavior. They FAIL while bugs remain in implementation.
 */
jest.mock("../../../src/modules/categories/repositories/commands/command_handler", () => ({
  addCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
}));

jest.mock("../../../src/modules/categories/repositories/queries/query_handler", () => ({
  getCategory: jest.fn(),
  getAllCategories: jest.fn(),
  getAllCategoriesWithJobcount: jest.fn(),
}));

const CategoryCommandDomain = require("../../../src/modules/categories/repositories/commands/domain");
const CategoryQueryDomain = require("../../../src/modules/categories/repositories/queries/domain");
const apiHandler = require("../../../src/modules/categories/handlers/api_handler");
const commandModel = require("../../../src/modules/categories/repositories/commands/command_model");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const {
  ConflictError,
  NotFoundError,
} = require("../../../src/helpers/errors");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("[QA] categories module", () => {
  describe("Query — empty list should paginate not 404", () => {
    it("[BUG-CA-001] getAllCategories should return empty array when no categories match", async () => {
      const domain = new CategoryQueryDomain({});
      domain.query = {
        findAllCategories: jest.fn().mockResolvedValue({
          err: "Data Not Found Please Try Another Input",
          data: null,
        }),
        countAllCategories: jest.fn().mockResolvedValue({ err: null, data: 0 }),
      };

      const result = await domain.getAllCategories({ page: 1, limit: 10, search: "none" });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
      expect(result.meta.total_data).toBe(0);
    });
  });

  describe("Security — mutating routes require admin auth", () => {
    it("[BUG-CA-002] POST /categories route should require admin authentication middleware", () => {
      let middlewares = [];

      const mockServer = {
        get: jest.fn(),
        post: jest.fn((path, ...handlers) => {
          if (path === "/api/v1/categories") {
            middlewares = handlers.slice(0, -1);
          }
        }),
        put: jest.fn(),
        delete: jest.fn(),
      };

      jest.isolateModules(() => {
        require("../../../src/routes/categories")(mockServer);
      });

      expect(middlewares.length).toBeGreaterThan(0);
      const middlewareNames = middlewares.map((fn) => fn.name || String(fn));
      expect(middlewareNames.some((name) => /verify|admin|auth|token/i.test(name))).toBe(true);
    });
  });

  describe("Business logic — duplicate category name", () => {
    it("[BUG-CA-003] addCategory should return ConflictError on duplicate name", async () => {
      const domain = new CategoryCommandDomain({});
      domain.command = {
        insertOne: jest.fn().mockResolvedValue({
          err: new Error("duplicate key value violates unique constraint"),
          data: null,
        }),
      };
      domain.query = { findOne: jest.fn() };

      const result = await domain.addCategory({ name: "Technology" });

      expect(result.err).toBeInstanceOf(ConflictError);
      expect(result.err).not.toBeInstanceOf(require("../../../src/helpers/errors").InternalServerError);
    });
  });

  describe("Handler — wrong response helper for jobcount", () => {
    it("[BUG-CA-004] getAllCategoriesWithJobcount should not send pagination meta", async () => {
      const res = createMockResponse();
      const req = createMockRequest();
      const queryHandler = require("../../../src/modules/categories/repositories/queries/query_handler");
      const data = [{ id: 1, name: "Technology", job_count: 3 }];

      queryHandler.getAllCategoriesWithJobcount.mockResolvedValue(wrapper.data(data));

      await apiHandler.getAllCategoriesWithJobcount(req, res);

      const body = res.send.mock.calls[0][0];
      expect(body).not.toHaveProperty("meta");
    });
  });

  describe("Validation — category name constraints", () => {
    it("[BUG-CA-005] addCategory schema should enforce max length on name", () => {
      const { error } = commandModel.addCategoryType.validate({
        name: "a".repeat(256),
      });
      expect(error).toBeDefined();
    });
  });

  describe("Query — jobcount endpoint empty result", () => {
    it("[BUG-CA-006] getAllCategoriesWithJobcount should return empty array not NotFoundError", async () => {
      const domain = new CategoryQueryDomain({});
      domain.query = {
        findAllCategoriesWithJobcount: jest.fn().mockResolvedValue({
          err: "Data Not Found Please Try Another Input",
          data: null,
        }),
      };

      const result = await domain.getAllCategoriesWithJobcount();

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
    });
  });

  describe("Validation — whitespace-only category name", () => {
    it("[BUG-CA-007] addCategory schema should reject blank name", () => {
      const { error } = commandModel.addCategoryType.validate({ name: "   " });
      expect(error).toBeDefined();
    });
  });
});
