/**
 * QA Bug-Hunting Tests — nationalities
 */
const NationalitiesCommandDomain = require("../../../src/modules/nationalities/repositories/commands/domain");
const NationalitiesQueryDomain = require("../../../src/modules/nationalities/repositories/queries/domain");
const commandModel = require("../../../src/modules/nationalities/repositories/commands/command_model");
const { ConflictError } = require("../../../src/helpers/errors");

describe("[QA] nationalities module", () => {
  describe("Security — mutating routes require admin auth", () => {
    it("[BUG-NA-001] POST /nationalities route should require admin authentication middleware", () => {
      let middlewares = [];

      const mockServer = {
        get: jest.fn(),
        post: jest.fn((path, ...handlers) => {
          if (path === "/api/v1/nationalities") {
            middlewares = handlers.slice(0, -1);
          }
        }),
        put: jest.fn(),
        delete: jest.fn(),
      };

      jest.isolateModules(() => {
        require("../../../src/routes/nationalities")(mockServer);
      });

      expect(middlewares.length).toBeGreaterThan(0);
      const middlewareNames = middlewares.map((fn) => fn.name || String(fn));
      expect(middlewareNames.some((name) => /verify|admin|auth|token/i.test(name))).toBe(true);
    });
  });

  describe("Query — empty list should paginate", () => {
    it("[BUG-NA-002] getAllNationalities should return empty array when no records match", async () => {
      const domain = new NationalitiesQueryDomain({});
      domain.query = {
        findAllNationalities: jest.fn().mockResolvedValue({
          err: "Data Not Found Please Try Another Input",
          data: null,
        }),
        countAllNationalities: jest.fn().mockResolvedValue({ err: null, data: 0 }),
      };

      const result = await domain.getAllNationalities({ page: 1, limit: 10, search: "none" });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
      expect(result.meta.total_data).toBe(0);
    });
  });

  describe("Business logic — duplicate nationality", () => {
    it("[BUG-NA-003] addNationality should return ConflictError on duplicate iso_alpha2", async () => {
      const domain = new NationalitiesCommandDomain({});
      domain.command = {
        insertOne: jest.fn().mockResolvedValue({
          err: new Error("duplicate key value violates unique constraint"),
          data: null,
        }),
      };

      const result = await domain.addNationality({
        country_name: "Indonesia",
        iso_alpha2: "ID",
        iso_alpha3: "IDN",
      });

      expect(result.err).toBeInstanceOf(ConflictError);
    });
  });

  describe("Validation — ISO code length", () => {
    it("[BUG-NA-004] addNationalityType should enforce iso_alpha2 length of 2", () => {
      const { error } = commandModel.addNationalityType.validate({
        country_name: "Indonesia",
        iso_alpha2: "IDN",
        iso_alpha3: "IDN",
      });
      expect(error).toBeDefined();
    });
  });

  describe("Security — DELETE route auth", () => {
    it("[BUG-NA-005] DELETE /nationalities/:id route should require admin authentication", () => {
      let middlewares = [];

      const mockServer = {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn((path, ...handlers) => {
          if (path === "/api/v1/nationalities/:id") {
            middlewares = handlers.slice(0, -1);
          }
        }),
      };

      jest.isolateModules(() => {
        require("../../../src/routes/nationalities")(mockServer);
      });

      expect(middlewares.length).toBeGreaterThan(0);
      const middlewareNames = middlewares.map((fn) => fn.name || String(fn));
      expect(middlewareNames.some((name) => /verify|admin|auth|token/i.test(name))).toBe(true);
    });
  });
});
