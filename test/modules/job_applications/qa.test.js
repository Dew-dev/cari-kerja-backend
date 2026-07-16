/**
 * QA Bug-Hunting Tests — job_applications
 * Tests assert CORRECT expected behavior. They FAIL while bugs remain in implementation.
 */
jest.mock("uuid", () => ({
  v4: jest.fn(() => "app-uuid-1234"),
}));

jest.mock("../../../src/helpers/queues/email.queue", () => ({
  addEmailJob: jest.fn().mockResolvedValue(undefined),
}));

const JobApplicationDomain = require("../../../src/modules/job_applications/repositories/commands/domain");
const commandModel = require("../../../src/modules/job_applications/repositories/commands/command_model");
const {
  ConflictError,
} = require("../../../src/helpers/errors");

describe("[QA] job_applications module", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  const jobPostId = "550e8400-e29b-41d4-a716-446655440010";
  const applicationId = "550e8400-e29b-41d4-a716-446655440020";

  describe("Business logic — duplicate application", () => {
    it("[BUG-JA-001] createJobApplication should return ConflictError when worker already applied", async () => {
      const domain = new JobApplicationDomain({});
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
      expect(domain.command.insertOne).not.toHaveBeenCalled();
    });
  });

  describe("Concurrency — partial insert rollback", () => {
    it("[BUG-JA-002] createJobApplication should rollback application when answers insert fails", async () => {
      const domain = new JobApplicationDomain({});
      domain.query = {
        findOne: jest.fn().mockResolvedValue({ err: null, data: null }),
        findAllByJobPostId: jest.fn(),
      };
      domain.command = {
        insertOne: jest.fn().mockResolvedValue({ err: null, data: { id: "app-uuid-1234" } }),
        insertMany: jest.fn().mockResolvedValue({ err: new Error("answers insert failed"), data: null }),
        deleteOne: jest.fn().mockResolvedValue({ err: null, data: true }),
      };

      const result = await domain.createJobApplication({
        job_post_id: jobPostId,
        worker_id: workerId,
        application_status_id: 1,
        answers: [{ question_id: "550e8400-e29b-41d4-a716-446655440030", answer: "Yes" }],
      });

      expect(result.err).toBeTruthy();
      expect(domain.command.deleteOne).toHaveBeenCalledWith(
        expect.objectContaining({ id: "app-uuid-1234" }),
        "job_applications"
      );
    });
  });

  describe("Validation — application answers schema", () => {
    it("[BUG-JA-003] createJobApplicationParamType should preserve validated answers in payload", () => {
      const questionId = "550e8400-e29b-41d4-a716-446655440030";
      const { value, error } = commandModel.createJobApplicationParamType.validate({
        job_post_id: jobPostId,
        worker_id: workerId,
        application_status_id: 1,
        answers: [{ question_id: questionId, answer: "Yes" }],
      });

      expect(error).toBeUndefined();
      expect(value.answers).toEqual([
        expect.objectContaining({ question_id: questionId, answer: "Yes" }),
      ]);
    });
  });

  describe("Validation — application note schema", () => {
    it("[BUG-JA-004] addApplicationNote schema should require UUID application_id", () => {
      const { error } = commandModel.addApplicationNoteParamType.validate({
        application_id: "not-a-uuid",
        recruiter_id: recruiterId,
        note: "Good candidate",
      });
      expect(error).toBeDefined();
    });
  });

  describe("Validation — recruiter_id on notes", () => {
    it("[BUG-JA-005] addApplicationNote schema should require UUID recruiter_id", () => {
      const { error } = commandModel.addApplicationNoteParamType.validate({
        application_id: applicationId,
        recruiter_id: "not-a-uuid",
        note: "Good candidate",
      });
      expect(error).toBeDefined();
    });
  });

  describe("Race condition — duplicate apply", () => {
    it("[BUG-JA-006] createJobApplication should handle unique constraint race with ConflictError", async () => {
      const domain = new JobApplicationDomain({});
      domain.query = {
        findOne: jest.fn().mockResolvedValue({ err: null, data: null }),
      };
      domain.command = {
        insertOne: jest.fn().mockResolvedValue({
          err: new Error("duplicate key value violates unique constraint"),
          data: null,
        }),
      };

      const result = await domain.createJobApplication({
        job_post_id: jobPostId,
        worker_id: workerId,
        application_status_id: 1,
      });

      expect(result.err).toBeInstanceOf(ConflictError);
    });
  });
});
