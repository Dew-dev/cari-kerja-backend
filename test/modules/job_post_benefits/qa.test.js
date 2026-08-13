/**
 * QA Bug-Hunting Tests — job_post_benefits
 */
jest.mock("uuid", () => ({
  v4: jest.fn(() => "benefit-uuid-1234"),
}));

const JobPostBenefitsDomain = require("../../../src/modules/job_post_benefits/repositories/commands/domain");
const JobPostBenefitsQueryDomain = require("../../../src/modules/job_post_benefits/repositories/queries/domain");
const { ForbiddenError, NotFoundError } = require("../../../src/helpers/errors");

describe("[QA] job_post_benefits module", () => {
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  const otherRecruiterId = "550e8400-e29b-41d4-a716-446655440099";
  const jobPostId = "550e8400-e29b-41d4-a716-446655440010";
  const benefitId = "550e8400-e29b-41d4-a716-446655440020";

  describe("Field mapping — insert benefit text", () => {
    it("[BUG-JPB-001] insertOne should map payload.benefit not payload.requirement", async () => {
      const domain = new JobPostBenefitsDomain({});
      domain.domain = {
        getJobpostById: jest.fn().mockResolvedValue({
          err: null,
          data: { id: jobPostId, recruiter_id: recruiterId },
        }),
      };
      domain.command = {
        insertOne: jest.fn().mockResolvedValue({ err: null, data: { id: benefitId } }),
      };

      await domain.insertOne({
        job_post_id: jobPostId,
        benefit: "Health Insurance",
        order_index: 1,
        recruiter_id: recruiterId,
      });

      expect(domain.command.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({ benefit: "Health Insurance" })
      );
    });
  });

  describe("Security — update ownership", () => {
    it("[BUG-JPB-002] updateOne should verify recruiter owns the job post", async () => {
      const domain = new JobPostBenefitsDomain({});
      domain.query = {
        findOne: jest.fn().mockResolvedValue({ err: null, data: { id: benefitId } }),
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
        id: benefitId,
        job_post_id: jobPostId,
        benefit: "Updated",
        order_index: 1,
        recruiter_id: recruiterId,
      });

      expect(result.err).toBeInstanceOf(ForbiddenError);
      expect(domain.command.updateOneNew).not.toHaveBeenCalled();
    });
  });

  describe("Query — empty list", () => {
    it("[BUG-JPB-003] getAllJobPostBenefitsByJobPostId should return empty array not NotFoundError", async () => {
      const domain = new JobPostBenefitsQueryDomain({});
      domain.query = {
        getAllByJobPostId: jest.fn().mockResolvedValue({
          err: "Data Not Found Please Try Another Input",
          data: null,
        }),
      };

      const result = await domain.getAllJobPostBenefitsByJobPostId({ job_post_id: jobPostId });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
    });
  });

  describe("Security — delete ownership", () => {
    it("[BUG-JPB-004] deleteOne should verify recruiter owns job post before delete", async () => {
      const domain = new JobPostBenefitsDomain({});
      domain.query = {
        findOne: jest.fn().mockResolvedValue({ err: null, data: { id: benefitId } }),
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
        id: benefitId,
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
      });

      expect(result.err).toBeInstanceOf(ForbiddenError);
      expect(domain.command.deleteOne).not.toHaveBeenCalled();
    });
  });
});
