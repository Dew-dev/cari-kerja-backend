/**
 * QA Bug-Hunting Tests — job_post_requirements
 */
jest.mock("uuid", () => ({
  v4: jest.fn(() => "requirement-uuid-1234"),
}));

const JobPostRequirementsDomain = require("../../../src/modules/job_post_requirements/repositories/commands/domain");
const JobPostRequirementsQueryDomain = require("../../../src/modules/job_post_requirements/repositories/queries/domain");
const { ForbiddenError } = require("../../../src/helpers/errors");

describe("[QA] job_post_requirements module", () => {
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  const otherRecruiterId = "550e8400-e29b-41d4-a716-446655440099";
  const jobPostId = "550e8400-e29b-41d4-a716-446655440010";
  const requirementId = "550e8400-e29b-41d4-a716-446655440020";

  describe("Security — update ownership", () => {
    it("[BUG-JPR-001] updateOne should verify recruiter owns the job post", async () => {
      const domain = new JobPostRequirementsDomain({});
      domain.query = {
        findOne: jest.fn().mockResolvedValue({ err: null, data: { id: requirementId } }),
      };
      domain.domain = {
        getJobpostById: jest.fn().mockResolvedValue({
          err: null,
          data: { id: jobPostId, recruiter_id: otherRecruiterId },
        }),
      };
      domain.command = {
        updateOneNew: jest.fn().mockResolvedValue({ err: null, data: true }),
      };

      const result = await domain.updateOne({
        id: requirementId,
        job_post_id: jobPostId,
        requirement: "Updated requirement",
        order_index: 1,
        recruiter_id: recruiterId,
      });

      expect(result.err).toBeInstanceOf(ForbiddenError);
      expect(domain.command.updateOneNew).not.toHaveBeenCalled();
    });
  });

  describe("Query — empty list", () => {
    it("[BUG-JPR-002] getAllJobPostRequirementsByJobPostId should return empty array", async () => {
      const domain = new JobPostRequirementsQueryDomain({});
      domain.query = {
        getAllByJobPostId: jest.fn().mockResolvedValue({
          err: "Data Not Found Please Try Another Input",
          data: null,
        }),
      };

      const result = await domain.getAllJobPostRequirementsByJobPostId({ job_post_id: jobPostId });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
    });
  });

  describe("Security — delete ownership", () => {
    it("[BUG-JPR-003] deleteOne should verify recruiter owns job post", async () => {
      const domain = new JobPostRequirementsDomain({});
      domain.query = {
        findOne: jest.fn().mockResolvedValue({ err: null, data: { id: requirementId } }),
      };
      domain.domain = {
        getJobpostById: jest.fn().mockResolvedValue({
          err: null,
          data: { id: jobPostId, recruiter_id: otherRecruiterId },
        }),
      };
      domain.command = {
        deleteOne: jest.fn().mockResolvedValue({ err: null, data: true }),
      };

      const result = await domain.deleteOne({
        id: requirementId,
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
      });

      expect(result.err).toBeInstanceOf(ForbiddenError);
      expect(domain.command.deleteOne).not.toHaveBeenCalled();
    });
  });

  describe("Routing — GET should not require auth but mutations need recruiter role", () => {
    it("[BUG-JPR-004] POST job-post-requirements route should require recruiter role middleware", () => {
      let middlewares = [];

      const mockServer = {
        get: jest.fn(),
        post: jest.fn((path, ...handlers) => {
          if (path.includes("job-post-requirements")) {
            middlewares = handlers.slice(0, -1);
          }
        }),
        put: jest.fn(),
        delete: jest.fn(),
      };

      jest.isolateModules(() => {
        jest.doMock("../../../src/middlewares/verifyToken", () => jest.fn());
        require("../../../src/routes/job_post_requirements")(mockServer);
      });

      const middlewareNames = middlewares.map((fn) => fn.name || String(fn));
      expect(middlewareNames.some((name) => /recruiter|role/i.test(name))).toBe(true);
    });
  });
});
