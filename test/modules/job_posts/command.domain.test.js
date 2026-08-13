jest.mock("uuid", () => ({ v4: jest.fn(() => "jobpost-uuid-1234") }));
jest.mock("../../../src/helpers/queues/email.queue", () => ({
  addEmailJob: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../../../src/modules/job_titles/helpers/resolve_job_title", () => ({
  resolveJobTitle: jest.fn().mockResolvedValue({
    id: "550e8400-e29b-41d4-a716-446655440099",
    name: "Backend Developer",
    slug: "backend-developer",
  }),
}));

const JobPostsCommandDomain = require("../../../src/modules/job_posts/repositories/commands/domain");
const {
  NotFoundError,
  InternalServerError,
  ForbiddenError,
  BadRequestError,
} = require("../../../src/helpers/errors");

describe("Job Posts Command Domain", () => {
  const jobPostId = "550e8400-e29b-41d4-a716-446655440000";
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  const workerId = "550e8400-e29b-41d4-a716-446655440002";
  const applicationId = "550e8400-e29b-41d4-a716-446655440003";
  let domain;
  let mockCommand;
  let mockQuery;
  let mockPaymentQuery;
  let mockCandidatePipelineQuery;

  beforeEach(() => {
    domain = new JobPostsCommandDomain({});
    mockCommand = {
      db: { executeQuery: jest.fn().mockResolvedValue({ rows: [] }) },
      insertJobPost: jest.fn(),
      insertMany: jest.fn(),
      deleteAppliedJobpost: jest.fn(),
      updateJobApplicationStatus: jest.fn(),
      archiveJobPost: jest.fn(),
      restoreJobPost: jest.fn(),
      deleteJobPost: jest.fn(),
      insertOne: jest.fn(),
      insertApplicationStageHistory: jest.fn().mockResolvedValue({ err: null }),
    };
    mockQuery = {
      findOne: jest.fn(),
      findOneJobPost: jest.fn(),
      findOneJobApplication: jest.fn(),
      findApplicationWithUser: jest.fn(),
      findAllByJobPostId: jest.fn().mockResolvedValue({ err: null, data: [] }),
      findStageForValidation: jest.fn().mockResolvedValue({ err: null, data: { id: 2 } }),
    };
    mockPaymentQuery = {};
    mockCandidatePipelineQuery = {
      ensureStagesForJobPost: jest.fn().mockResolvedValue({
        err: null,
        data: [
          { id: 10, stage_type: "applied" },
          { id: 11, stage_type: "screening" },
        ],
      }),
    };
    domain.command = mockCommand;
    domain.query = mockQuery;
    domain.paymentQuery = mockPaymentQuery;
    domain.candidatePipelineQuery = mockCandidatePipelineQuery;
    domain._checkPostingQuota = jest.fn().mockResolvedValue({ err: null });
  });

  describe("createJobPost", () => {
    it("should create job post when quota check passes", async () => {
      mockCommand.insertJobPost.mockResolvedValue({ id: jobPostId });

      const result = await domain.createJobPost({
        recruiter_id: recruiterId,
        title: "Backend Developer",
        description: "Node.js role",
        employment_type_id: 1,
        experience_level_id: 2,
        salary_type_id: 1,
        salary_min: 5000,
        currency_id: 1,
        status_id: 3,
        category_id: 1,
      });

      expect(result.err).toBeNull();
      expect(result.data.title).toBe("Backend Developer");
    });

    it("should return ForbiddenError when quota exceeded", async () => {
      domain._checkPostingQuota.mockResolvedValue({
        err: new ForbiddenError("Quota exceeded"),
      });

      const result = await domain.createJobPost({
        recruiter_id: recruiterId,
        title: "Backend Developer",
        description: "Node.js role",
        employment_type_id: 1,
        experience_level_id: 2,
        salary_type_id: 1,
        salary_min: 5000,
        currency_id: 1,
        status_id: 3,
        category_id: 1,
      });

      expect(result.err).toBeInstanceOf(ForbiddenError);
      expect(mockCommand.insertJobPost).not.toHaveBeenCalled();
    });
  });

  describe("deleteAppliedJobpost", () => {
    it("should withdraw application successfully", async () => {
      mockCommand.deleteAppliedJobpost.mockResolvedValue({ rowCount: 1 });

      const result = await domain.deleteAppliedJobpost({
        job_post_id: jobPostId,
        worker_id: workerId,
      });

      expect(result.err).toBeNull();
      expect(result.data).toBe("Application withdrawn successfully");
    });

    it("should return NotFoundError when application not found", async () => {
      mockCommand.deleteAppliedJobpost.mockResolvedValue({ rowCount: 0 });

      const result = await domain.deleteAppliedJobpost({
        job_post_id: jobPostId,
        worker_id: workerId,
      });

      expect(result.err).toBeInstanceOf(NotFoundError);
    });
  });

  describe("archiveJobPost", () => {
    it("should archive job when recruiter owns it", async () => {
      mockQuery.findOneJobPost.mockResolvedValue({ err: null, data: { id: jobPostId } });
      mockCommand.archiveJobPost.mockResolvedValue({ err: null });

      const result = await domain.archiveJobPost({ id: jobPostId, recruiter_id: recruiterId });

      expect(result.err).toBeNull();
      expect(result.data).toBe("Job archived");
    });

    it("should return NotFoundError when job not owned", async () => {
      mockQuery.findOneJobPost.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.archiveJobPost({ id: jobPostId, recruiter_id: recruiterId });

      expect(result.err).toBeInstanceOf(NotFoundError);
    });
  });

  describe("deleteJobPost", () => {
    it("should delete job when recruiter owns it", async () => {
      mockQuery.findOneJobPost.mockResolvedValue({ err: null, data: { id: jobPostId } });
      mockCommand.deleteJobPost.mockResolvedValue({ err: null });

      const result = await domain.deleteJobPost({ id: jobPostId, recruiter_id: recruiterId });

      expect(result.err).toBeNull();
      expect(result.data).toBe("Job deleted successfully");
    });
  });

  describe("updateApplicationStatus", () => {
    it("should update status for authorized recruiter and record stage history", async () => {
      mockQuery.findOneJobApplication.mockResolvedValue({
        err: null,
        data: { recruiter_id: recruiterId, job_post_id: jobPostId, application_status_id: 1 },
      });
      mockCommand.updateJobApplicationStatus.mockResolvedValue({ err: null });
      mockQuery.findApplicationWithUser.mockResolvedValue({
        err: null,
        data: {
          email: "worker@example.com",
          user_name: "Worker",
          job_title: "Backend Developer",
          status_name: "Interview",
        },
      });

      const result = await domain.updateApplicationStatus({
        id: applicationId,
        application_status_id: 2,
        recruiter_id: recruiterId,
      });

      expect(result.err).toBeNull();
      expect(result.data).toBe("Application status updated successfully");
      expect(mockQuery.findStageForValidation).toHaveBeenCalledWith({
        id: 2,
        job_post_id: jobPostId,
      });
      expect(mockCommand.insertApplicationStageHistory).toHaveBeenCalledWith({
        application_id: applicationId,
        from_stage_id: 1,
        to_stage_id: 2,
        changed_by_recruiter_id: recruiterId,
        note: null,
      });
    });

    it("should return ForbiddenError for wrong recruiter", async () => {
      mockQuery.findOneJobApplication.mockResolvedValue({
        err: null,
        data: { recruiter_id: "other-recruiter", job_post_id: jobPostId, application_status_id: 1 },
      });

      const result = await domain.updateApplicationStatus({
        id: applicationId,
        application_status_id: 2,
        recruiter_id: recruiterId,
      });

      expect(result.err).toBeInstanceOf(ForbiddenError);
    });

    it("should return BadRequestError when stage does not belong to job post", async () => {
      mockQuery.findOneJobApplication.mockResolvedValue({
        err: null,
        data: { recruiter_id: recruiterId, job_post_id: jobPostId, application_status_id: 1 },
      });
      mockQuery.findStageForValidation.mockResolvedValue({ err: null, data: null });

      const result = await domain.updateApplicationStatus({
        id: applicationId,
        application_status_id: 999,
        recruiter_id: recruiterId,
      });

      expect(result.err).toBeInstanceOf(BadRequestError);
      expect(mockCommand.updateJobApplicationStatus).not.toHaveBeenCalled();
    });
  });

  describe("createJobApplication", () => {
    it("should always resolve application_status_id to the job post's 'applied' stage, ignoring client value", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: null });
      mockCommand.insertOne.mockResolvedValue({ err: null });

      const result = await domain.createJobApplication({
        job_post_id: jobPostId,
        worker_id: workerId,
        resume_id: null,
        cover_letter: "Halo",
        application_status_id: 999, // nilai client, harus diabaikan
        answers: [],
      });

      expect(mockCandidatePipelineQuery.ensureStagesForJobPost).toHaveBeenCalledWith(
        jobPostId,
      );
      expect(result.err).toBeNull();
      expect(mockCommand.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({ application_status_id: 10 }),
        "job_applications",
      );
      expect(result.data.job_application.application_status_id).toBe(10);
    });

    it("should return InternalServerError when 'applied' stage is not configured", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: null });
      mockCandidatePipelineQuery.ensureStagesForJobPost.mockResolvedValue({
        err: null,
        data: [{ id: 11, stage_type: "screening" }],
      });

      const result = await domain.createJobApplication({
        job_post_id: jobPostId,
        worker_id: workerId,
      });

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(mockCommand.insertOne).not.toHaveBeenCalled();
    });
  });

  describe("duplicateJobPost", () => {
    const originalJob = {
      id: jobPostId,
      title: "Lead Cloud Solutions Architect",
      description: "Build clouds",
      employment_type_id: 1,
      experience_level_id: 4,
      salary_type_id: 1,
      salary_min: 28000000,
      salary_max: 42000000,
      currency_id: 61,
      location: "Jakarta Selatan",
      deadline: "2026-12-31",
      category_id: 3,
      province: "DKI Jakarta",
      city: "Jakarta Selatan",
      is_remote: false,
      tags: [{ id: 1, name: "Cloud" }],
    };

    beforeEach(() => {
      mockCommand.insertJobPostTag = jest.fn().mockResolvedValue({ err: null });
      mockQuery.findJobWithTags = jest.fn().mockResolvedValue({
        err: null,
        data: originalJob,
      });
      mockQuery.getJobPostRequirements = jest.fn().mockResolvedValue({ err: null, data: [] });
      mockQuery.getJobPostBenefits = jest.fn().mockResolvedValue({ err: null, data: [] });
      mockQuery.getJobPostResponsibilities = jest.fn().mockResolvedValue({
        err: null,
        data: [],
      });
      mockQuery.findAllByJobPostId = jest.fn().mockResolvedValue({ err: null, data: [] });
    });

    it("copies location fields and is_remote so NOT NULL constraints pass", async () => {
      const newId = "550e8400-e29b-41d4-a716-446655440099";
      mockCommand.insertJobPost.mockResolvedValue({ id: newId });

      const result = await domain.duplicateJobPost({
        id: jobPostId,
        recruiter_id: recruiterId,
      });

      expect(result.err).toBeNull();
      expect(result.data.id).toBe(newId);
      expect(mockCommand.insertJobPost).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Lead Cloud Solutions Architect (Copy)",
          status_id: 3,
          province: "DKI Jakarta",
          city: "Jakarta Selatan",
          is_remote: false,
        })
      );
    });

    it("defaults is_remote to false when original value is null", async () => {
      mockQuery.findJobWithTags.mockResolvedValue({
        err: null,
        data: { ...originalJob, is_remote: null, province: null, city: null },
      });
      mockCommand.insertJobPost.mockResolvedValue({ id: "new-job-id" });

      await domain.duplicateJobPost({ id: jobPostId, recruiter_id: recruiterId });

      expect(mockCommand.insertJobPost).toHaveBeenCalledWith(
        expect.objectContaining({ is_remote: false })
      );
    });
  });
});
