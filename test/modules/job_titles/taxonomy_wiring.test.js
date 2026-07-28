const queryModel = require("../../../src/modules/workers/repositories/queries/query_model");
const WorkersQueryDomain = require("../../../src/modules/workers/repositories/queries/domain");
const weCommandModel = require("../../../src/modules/work-experiences/repositories/commands/command_model");
const WorkExpCommandDomain = require("../../../src/modules/work-experiences/repositories/commands/domain");

jest.mock("../../../src/modules/job_titles/helpers/resolve_job_title", () => ({
  resolveJobTitle: jest.fn(),
  JobTitleResolveError: class JobTitleResolveError extends Error {
    constructor(message, code) {
      super(message);
      this.name = "JobTitleResolveError";
      this.code = code;
    }
  },
}));

jest.mock("../../../src/helpers/queues/matching.queue", () => ({
  enqueueRecomputeWorkerMatches: jest.fn().mockResolvedValue(undefined),
}));

const { resolveJobTitle } = require("../../../src/modules/job_titles/helpers/resolve_job_title");

describe("job titles taxonomy wiring", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";
  const titleId = "550e8400-e29b-41d4-a716-446655440099";

  describe("workers tenure filter validation", () => {
    it("allows category_id alone; min_years requires category_id", () => {
      const onlyId = queryModel.getWorkersParamType.validate({
        category_id: 1,
      });
      const onlyYears = queryModel.getWorkersParamType.validate({
        min_years: 2,
      });
      const both = queryModel.getWorkersParamType.validate({
        category_id: 1,
        min_years: 2,
      });

      expect(onlyId.error).toBeUndefined();
      expect(onlyYears.error).toBeDefined();
      expect(both.error).toBeUndefined();
    });
  });

  describe("workers tenure filter SQL", () => {
    it("filters by category_id tenure with JOIN job_titles and HAVING sum of years", async () => {
      const domain = new WorkersQueryDomain({});
      let captured = null;
      domain.query = {
        countAllWorkers: jest.fn().mockResolvedValue({ err: null, data: { rowCount: 0 } }),
        findAll: jest.fn().mockImplementation((payload) => {
          captured = payload;
          return Promise.resolve({
            err: null,
            data: [],
            meta: { page: 1, limit: 12, total: 0, totalPage: 0 },
          });
        }),
      };

      await domain.getWorkers({
        page: 1,
        limit: 12,
        category_id: 5,
        min_years: 3,
      });

      expect(captured.conditions).toMatch(/jt\.category_id/);
      expect(captured.conditions).toMatch(/JOIN job_titles jt/i);
      expect(captured.conditions).toMatch(/EXTRACT\(EPOCH/i);
      expect(captured.conditions).toMatch(/31557600/);
      expect(captured.conditions).toMatch(/HAVING/i);
      expect(captured.values).toEqual(
        expect.arrayContaining([5, 3])
      );
    });

    it("defaults min_years to 0 when only category_id is provided", async () => {
      const domain = new WorkersQueryDomain({});
      let captured = null;
      domain.query = {
        countAllWorkers: jest.fn().mockResolvedValue({ err: null, data: { rowCount: 2 } }),
        findAll: jest.fn().mockImplementation((payload) => {
          captured = payload;
          return Promise.resolve({
            err: null,
            data: [{ id: "w1" }],
            meta: { page: 1, limit: 12, total: 2, totalPage: 1 },
          });
        }),
      };

      const result = await domain.getWorkers({
        page: 1,
        limit: 12,
        category_id: 1,
      });

      expect(result.err).toBeNull();
      expect(captured.conditions).toMatch(/jt\.category_id/);
      expect(captured.values).toEqual(expect.arrayContaining([1, 0]));
    });

    it("returns empty list (not 404) when no workers match", async () => {
      const domain = new WorkersQueryDomain({});
      domain.query = {
        countAllWorkers: jest.fn().mockResolvedValue({ err: null, data: { rowCount: 0 } }),
        findAll: jest.fn().mockResolvedValue({
          err: null,
          data: [],
          meta: { page: 1, limit: 12, total: 0, totalPage: 0 },
        }),
      };

      const result = await domain.getWorkers({
        category_id: 2,
        min_years: 1,
        page: 1,
        limit: 12,
      });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
    });
  });

  describe("work experience create resolves job title", () => {
    it("requires category_id on insert schema", () => {
      const missing = weCommandModel.addWorkExperienceParamType.validate({
        worker_id: workerId,
        company_name: "Acme",
        job_title: "Engineer",
        job_title_id: titleId,
        start_date: "2020-01-01",
      });
      const ok = weCommandModel.addWorkExperienceParamType.validate({
        worker_id: workerId,
        company_name: "Acme",
        job_title: "Engineer",
        job_title_id: titleId,
        category_id: 1,
        start_date: "2020-01-01",
      });
      expect(missing.error).toBeDefined();
      expect(ok.error).toBeUndefined();
    });

    it("persists resolved job_title_id and canonical name on insert", async () => {
      resolveJobTitle.mockResolvedValue({
        id: titleId,
        name: "Software Engineer",
        slug: "software-engineer",
        category_id: 1,
      });

      const domain = new WorkExpCommandDomain({});
      domain.command = {
        insertOne: jest.fn().mockResolvedValue({
          err: null,
          data: { id: "exp-1" },
        }),
      };

      await domain.insertOne({
        worker_id: workerId,
        company_name: "Acme",
        job_title: "software engineer",
        category_id: 1,
        start_date: "2020-01-01",
        is_current: true,
      });

      expect(resolveJobTitle).toHaveBeenCalledWith(
        { id: undefined, name: "software engineer", category_id: 1 },
        expect.anything()
      );
      expect(domain.command.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          job_title_id: titleId,
          job_title: "Software Engineer",
        })
      );
      expect(domain.command.insertOne.mock.calls[0][0]).not.toHaveProperty(
        "category_id"
      );
    });
  });
});
