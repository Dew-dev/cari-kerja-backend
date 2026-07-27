const queryModel = require("../../../src/modules/workers/repositories/queries/query_model");
const WorkersQueryDomain = require("../../../src/modules/workers/repositories/queries/domain");
const weCommandModel = require("../../../src/modules/work-experiences/repositories/commands/command_model");
const WorkExpCommandDomain = require("../../../src/modules/work-experiences/repositories/commands/domain");

jest.mock("../../../src/modules/job_titles/helpers/resolve_job_title", () => ({
  resolveJobTitle: jest.fn(),
}));

jest.mock("../../../src/helpers/queues/matching.queue", () => ({
  enqueueRecomputeWorkerMatches: jest.fn().mockResolvedValue(undefined),
}));

const { resolveJobTitle } = require("../../../src/modules/job_titles/helpers/resolve_job_title");

describe("job titles taxonomy wiring", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";
  const titleId = "550e8400-e29b-41d4-a716-446655440099";

  describe("workers tenure filter validation", () => {
    it("requires job_title_id and min_years together", () => {
      const onlyId = queryModel.getWorkersParamType.validate({
        job_title_id: titleId,
      });
      const onlyYears = queryModel.getWorkersParamType.validate({
        min_years: 2,
      });
      const both = queryModel.getWorkersParamType.validate({
        job_title_id: titleId,
        min_years: 2,
      });

      expect(onlyId.error).toBeDefined();
      expect(onlyYears.error).toBeDefined();
      expect(both.error).toBeUndefined();
    });
  });

  describe("workers tenure filter SQL", () => {
    it("filters by job_title_id tenure with HAVING sum of years", async () => {
      const domain = new WorkersQueryDomain({});
      let captured = null;
      domain.query = {
        countAllWorkers: jest.fn().mockResolvedValue({ err: null, data: { rowCount: 0 } }),
        findAll: jest.fn().mockImplementation((payload) => {
          captured = payload;
          return Promise.resolve({
            err: null,
            data: [],
            meta: { page: 1, limit: 12, total_data: 0, total_pages: 0 },
          });
        }),
      };

      await domain.getWorkers({
        page: 1,
        limit: 12,
        job_title_id: titleId,
        min_years: 3,
      });

      expect(captured.conditions).toMatch(/job_title_id/);
      expect(captured.conditions).toMatch(/365\.25/);
      expect(captured.conditions).toMatch(/HAVING SUM/i);
      expect(captured.values).toEqual(
        expect.arrayContaining([titleId, 3])
      );
    });
  });

  describe("work experience create resolves job title", () => {
    it("accepts optional job_title_id on insert schema", () => {
      const { error } = weCommandModel.addWorkExperienceParamType.validate({
        worker_id: workerId,
        company_name: "Acme",
        job_title: "Engineer",
        job_title_id: titleId,
        start_date: "2020-01-01",
      });
      expect(error).toBeUndefined();
    });

    it("persists resolved job_title_id and canonical name on insert", async () => {
      resolveJobTitle.mockResolvedValue({
        id: titleId,
        name: "Software Engineer",
        slug: "software-engineer",
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
        start_date: "2020-01-01",
        is_current: true,
      });

      expect(resolveJobTitle).toHaveBeenCalledWith(
        { id: undefined, name: "software engineer" },
        expect.anything()
      );
      expect(domain.command.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          job_title_id: titleId,
          job_title: "Software Engineer",
        })
      );
    });
  });
});
