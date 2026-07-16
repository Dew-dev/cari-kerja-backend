/**
 * QA Bug-Hunting Tests — job_post_responsibilities
 */
jest.mock("uuid", () => ({
  v4: jest.fn(() => "responsibility-uuid-1234"),
}));

const JobPostResponsibilitiesDomain = require("../../../src/modules/job_post_responsibilities/repositories/commands/domain");
const JobPostResponsibilitiesQueryDomain = require("../../../src/modules/job_post_responsibilities/repositories/queries/domain");
const { ForbiddenError } = require("../../../src/helpers/errors");

describe("[QA] job_post_responsibilities module", () => {
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  const otherRecruiterId = "550e8400-e29b-41d4-a716-446655440099";
  const jobPostId = "550e8400-e29b-41d4-a716-446655440010";
  const responsibilityId = "550e8400-e29b-41d4-a716-446655440020";

  describe("Field mapping — insert responsibility text", () => {
    it("[BUG-JPRS-001] insertOne should map payload.responsibility not payload.requirement", async () => {
      const domain = new JobPostResponsibilitiesDomain({});
      domain.domain = {
        getJobpostById: jest.fn().mockResolvedValue({
          err: null,
          data: { id: jobPostId, recruiter_id: recruiterId },
        }),
      };
      domain.command = {
        insertOne: jest.fn().mockResolvedValue({ err: null, data: { id: responsibilityId } }),
      };

      await domain.insertOne({
        job_post_id: jobPostId,
        responsibility: "Manage team",
        order_index: 1,
        recruiter_id: recruiterId,
      });

      expect(domain.command.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({ responsibility: "Manage team" })
      );
    });
  });

  describe("Security — update ownership", () => {
    it("[BUG-JPRS-002] updateOne should verify recruiter owns the job post", async () => {
      const domain = new JobPostResponsibilitiesDomain({});
      domain.query = {
        findOne: jest.fn().mockResolvedValue({ err: null, data: { id: responsibilityId } }),
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
        id: responsibilityId,
        job_post_id: jobPostId,
        responsibility: "Updated",
        order_index: 1,
        recruiter_id: recruiterId,
      });

      expect(result.err).toBeInstanceOf(ForbiddenError);
      expect(domain.command.updateOneNew).not.toHaveBeenCalled();
    });
  });

  describe("Query — empty list", () => {
    it("[BUG-JPRS-003] getAllJobPostResponsibilitiesByJobPostId should return empty array", async () => {
      const domain = new JobPostResponsibilitiesQueryDomain({});
      domain.query = {
        getAllByJobPostId: jest.fn().mockResolvedValue({
          err: "Data Not Found Please Try Another Input",
          data: null,
        }),
      };

      const result = await domain.getAllJobPostResponsibilitiesByJobPostId({ job_post_id: jobPostId });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
    });
  });

  describe("Security — delete ownership", () => {
    it("[BUG-JPRS-004] deleteOne should verify recruiter owns job post", async () => {
      const domain = new JobPostResponsibilitiesDomain({});
      domain.query = {
        findOne: jest.fn().mockResolvedValue({ err: null, data: { id: responsibilityId } }),
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
        id: responsibilityId,
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
      });

      expect(result.err).toBeInstanceOf(ForbiddenError);
      expect(domain.command.deleteOne).not.toHaveBeenCalled();
    });
  });
});
