/**
 * QA Bug-Hunting Tests — job_posts
 */
jest.mock("uuid", () => ({
  v4: jest.fn(() => "jobpost-uuid-1234"),
}));

jest.mock("../../../src/helpers/queues/email.queue", () => ({
  addEmailJob: jest.fn(),
}));

const JobPostsCommandDomain = require("../../../src/modules/job_posts/repositories/commands/domain");
const JobPostsQueryDomain = require("../../../src/modules/job_posts/repositories/queries/domain");
const apiHandler = require("../../../src/modules/job_posts/handlers/api_handler");
const commandHandler = require("../../../src/modules/job_posts/repositories/commands/command_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const {
  NotFoundError,
  ConflictError,
} = require("../../../src/helpers/errors");

jest.mock("../../../src/modules/job_posts/repositories/commands/command_handler", () => ({
  createJobPostQuestions: jest.fn(),
  createJobApplication: jest.fn(),
  deleteAppliedJobpost: jest.fn(),
  updateApplicationStatus: jest.fn(),
}));

describe("[QA] job_posts module", () => {
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  const workerId = "550e8400-e29b-41d4-a716-446655440000";
  const jobPostId = "550e8400-e29b-41d4-a716-446655440010";
  const applicationId = "550e8400-e29b-41d4-a716-446655440020";

  describe("Atomicity — nested createJobPost inserts", () => {
    it("[BUG-JP-001] createJobPost should fail when requirements insert fails", async () => {
      const domain = new JobPostsCommandDomain({});
      domain._checkPostingQuota = jest.fn().mockResolvedValue({ err: null, data: { allowed: true } });
      domain.command = {
        insertJobPost: jest.fn().mockResolvedValue({ id: jobPostId }),
        insertMany: jest.fn().mockResolvedValue({ err: new Error("requirements insert failed"), data: null }),
      };

      const result = await domain.createJobPost({
        recruiter_id: recruiterId,
        title: "Backend Engineer",
        description: "Build APIs",
        employment_type_id: 1,
        experience_level_id: 1,
        salary_type_id: 1,
        location: "Jakarta",
        salary_min: 10000000,
        salary_max: 15000000,
        currency_id: 1,
        status_id: 1,
        deadline: new Date().toISOString(),
        requirements: [{ requirement: "Node.js", order_index: 1 }],
      });

      expect(result.err).toBeTruthy();
    });
  });

  describe("Security — recruiter job list route", () => {
    it("[BUG-JP-002] GET /recruiters/:recruiter_id/job-posts should require authentication", () => {
      let middlewares = [];

      const mockServer = {
        get: jest.fn((path, ...handlers) => {
          if (path.includes("recruiters/:recruiter_id/job-posts")) {
            middlewares = handlers.slice(0, -1);
          }
        }),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
      };

      jest.isolateModules(() => {
        require("../../../src/routes/jobposts")(mockServer);
      });

      expect(middlewares.length).toBeGreaterThan(0);
      const middlewareNames = middlewares.map((fn) => fn.name || String(fn));
      expect(middlewareNames.some((name) => /verify|auth|token/i.test(name))).toBe(true);
    });
  });

  describe("Handler — createJobPostQuestions validation", () => {
    it("[BUG-JP-003] createJobPostQuestions handler should reject invalid payload before command", async () => {
      commandHandler.createJobPostQuestions.mockResolvedValue({
        err: null,
        data: [],
      });

      const req = createMockRequest({
        params: { id: jobPostId },
        body: { question_text: "", question_type_id: "invalid" },
      });
      const res = createMockResponse();

      await apiHandler.createJobPostQuestions(req, res);

      expect(commandHandler.createJobPostQuestions).not.toHaveBeenCalled();
    });
  });

  describe("Error handling — withdraw application", () => {
    it("[BUG-JP-004] deleteAppliedJobpost should return NotFoundError when application missing", async () => {
      const domain = new JobPostsCommandDomain({});
      domain.command = {
        deleteAppliedJobpost: jest.fn().mockResolvedValue({ rowCount: 0 }),
      };

      const result = await domain.deleteAppliedJobpost({
        job_post_id: jobPostId,
        worker_id: workerId,
      });

      expect(result.err).toBeInstanceOf(NotFoundError);
    });
  });

  describe("Side effects — status update after email failure", () => {
    it("[BUG-JP-005] updateApplicationStatus should succeed even when email queue fails", async () => {
      const { addEmailJob } = require("../../../src/helpers/queues/email.queue");
      addEmailJob.mockRejectedValue(new Error("email queue down"));

      const domain = new JobPostsCommandDomain({});
      domain.query = {
        findOneJobApplication: jest.fn().mockResolvedValue({
          err: null,
          data: { recruiter_id: recruiterId, job_post_id: jobPostId },
        }),
        findApplicationWithUser: jest.fn().mockResolvedValue({
          err: null,
          data: {
            email: "worker@example.com",
            user_name: "Worker",
            job_title: "Engineer",
            status_name: "Reviewed",
          },
        }),
      };
      domain.command = {
        updateJobApplicationStatus: jest.fn().mockResolvedValue({ err: null, data: true }),
      };

      const result = await domain.updateApplicationStatus({
        id: applicationId,
        application_status_id: 2,
        recruiter_id: recruiterId,
      });

      expect(result.err).toBeNull();
      expect(result.data).toBeTruthy();
    });
  });

  describe("Query — empty job list", () => {
    it("[BUG-JP-006] getJobPostsLogic should return empty paginated list not NotFoundError", async () => {
      const domain = new JobPostsQueryDomain({});
      domain.query = {
        countAllJobPosts: jest.fn().mockResolvedValue({ data: { rowCount: 0 } }),
        findAll: jest.fn().mockResolvedValue({
          err: "Data Not Found Please Try Another Input",
          data: null,
        }),
      };

      const result = await domain.getJobPostsLogic({
        page: 1,
        limit: 10,
        sort_by: "created_at",
        sort_order: "desc",
      });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
    });
  });

  describe("Business logic — duplicate application", () => {
    it("[BUG-JP-007] createJobApplication should return ConflictError for duplicate apply", async () => {
      const domain = new JobPostsCommandDomain({});
      domain.query = {
        findOne: jest.fn().mockResolvedValue({
          err: null,
          data: { id: applicationId },
        }),
      };
      domain.command = { insertOne: jest.fn() };

      const result = await domain.createJobApplication({
        job_post_id: jobPostId,
        worker_id: workerId,
        application_status_id: 1,
      });

      expect(result.err).toBeInstanceOf(ConflictError);
    });
  });
});
