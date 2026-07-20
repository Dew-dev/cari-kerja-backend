jest.mock("../../../src/helpers/queues/email.queue", () => ({
  addEmailJob: jest.fn().mockResolvedValue(undefined),
}));

const CommunicationCommandDomain = require("../../../src/modules/communication/repositories/commands/domain");
const { addEmailJob } = require("../../../src/helpers/queues/email.queue");
const {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} = require("../../../src/helpers/errors");

describe("Communication Command Domain", () => {
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  const workerId = "550e8400-e29b-41d4-a716-446655440002";
  const applicationId = "550e8400-e29b-41d4-a716-446655440010";
  const jobPostId = "550e8400-e29b-41d4-a716-446655440020";
  const templateId = "550e8400-e29b-41d4-a716-446655440030";

  let domain;
  let mockCommand;
  let mockQuery;

  beforeEach(() => {
    domain = new CommunicationCommandDomain({});
    mockCommand = {
      insertTemplate: jest.fn(),
      updateTemplate: jest.fn(),
      softDeleteTemplate: jest.fn(),
      insertCampaign: jest.fn(),
      insertRecipient: jest.fn(),
      updateRecipientStatus: jest.fn(),
      incrementCampaignFailed: jest.fn(),
      updateWorkerEmailOptOut: jest.fn(),
      optOutByUnsubscribeToken: jest.fn(),
    };
    mockQuery = {
      findTemplateById: jest.fn(),
      findJobPostOwner: jest.fn(),
      findApplicationsForBulkSend: jest.fn(),
    };
    domain.command = mockCommand;
    domain.query = mockQuery;
    jest.clearAllMocks();
  });

  describe("createTemplate", () => {
    it("should create a template for recruiter", async () => {
      mockCommand.insertTemplate.mockResolvedValue({
        err: null,
        data: { id: templateId, name: "Interview invite", subject: "Hi", body: "Hello", channel: "email" },
      });

      const result = await domain.createTemplate({
        recruiter_id: recruiterId,
        name: "Interview invite",
        subject: "Hi {{candidate_name}}",
        body: "Hello",
      });

      expect(result.err).toBeNull();
      expect(result.data.name).toBe("Interview invite");
    });
  });

  describe("bulkSend", () => {
    it("should queue emails and skip opt-out candidates", async () => {
      mockQuery.findApplicationsForBulkSend.mockResolvedValue({
        err: null,
        data: [
          {
            application_id: applicationId,
            job_post_id: jobPostId,
            worker_id: workerId,
            worker_name: "Budi",
            email: "budi@example.com",
            email_opt_out: false,
            unsubscribe_token: "550e8400-e29b-41d4-a716-446655440099",
            job_title: "Developer",
            company_name: "EGI",
            stage_name: "Applied",
          },
          {
            application_id: "550e8400-e29b-41d4-a716-446655440011",
            job_post_id: jobPostId,
            worker_id: "550e8400-e29b-41d4-a716-446655440012",
            worker_name: "Ani",
            email: "ani@example.com",
            email_opt_out: true,
            unsubscribe_token: "550e8400-e29b-41d4-a716-446655440098",
            job_title: "Developer",
            company_name: "EGI",
            stage_name: "Applied",
          },
        ],
      });
      mockCommand.insertCampaign.mockResolvedValue({
        err: null,
        data: { id: "campaign-1" },
      });
      mockCommand.insertRecipient.mockResolvedValue({ err: null, data: { id: "recipient-1" } });

      const result = await domain.bulkSend({
        recruiter_id: recruiterId,
        subject: "Update for {{candidate_name}}",
        body: "Hi {{candidate_name}}",
        application_ids: [applicationId, "550e8400-e29b-41d4-a716-446655440011"],
      });

      expect(result.err).toBeNull();
      expect(result.data.queued).toBe(1);
      expect(result.data.skipped).toEqual([
        { application_id: "550e8400-e29b-41d4-a716-446655440011", reason: "opt_out" },
      ]);
      expect(addEmailJob).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "budi@example.com",
          subject: "Update for Budi",
          recipient_id: expect.any(String),
        }),
      );
    });

    it("should reject when applications do not belong to recruiter", async () => {
      mockQuery.findApplicationsForBulkSend.mockResolvedValue({
        err: null,
        data: [{ application_id: applicationId }],
      });

      const result = await domain.bulkSend({
        recruiter_id: recruiterId,
        subject: "Hi",
        body: "Hello",
        application_ids: [applicationId, "550e8400-e29b-41d4-a716-446655440099"],
      });

      expect(result.err).toBeInstanceOf(BadRequestError);
      expect(addEmailJob).not.toHaveBeenCalled();
    });

    it("should reject when job_post_id does not match applications", async () => {
      mockQuery.findJobPostOwner.mockResolvedValue({
        err: null,
        data: { recruiter_id: recruiterId },
      });
      mockQuery.findApplicationsForBulkSend.mockResolvedValue({
        err: null,
        data: [
          {
            application_id: applicationId,
            job_post_id: "other-job",
            worker_id: workerId,
            worker_name: "Budi",
            email: "budi@example.com",
            email_opt_out: false,
            unsubscribe_token: "550e8400-e29b-41d4-a716-446655440099",
          },
        ],
      });

      const result = await domain.bulkSend({
        recruiter_id: recruiterId,
        subject: "Hi",
        body: "Hello",
        application_ids: [applicationId],
        job_post_id: jobPostId,
      });

      expect(result.err).toBeInstanceOf(BadRequestError);
    });

    it("should return ForbiddenError when recruiter does not own job post", async () => {
      mockQuery.findJobPostOwner.mockResolvedValue({
        err: null,
        data: { recruiter_id: "other-recruiter" },
      });

      const result = await domain.bulkSend({
        recruiter_id: recruiterId,
        subject: "Hi",
        body: "Hello",
        application_ids: [applicationId],
        job_post_id: jobPostId,
      });

      expect(result.err).toBeInstanceOf(ForbiddenError);
    });
  });

  describe("unsubscribeByToken", () => {
    it("should opt out worker by token", async () => {
      mockCommand.optOutByUnsubscribeToken.mockResolvedValue({
        err: null,
        data: { id: workerId },
      });

      const result = await domain.unsubscribeByToken({
        token: "550e8400-e29b-41d4-a716-446655440099",
      });

      expect(result.err).toBeNull();
      expect(result.data.message).toContain("unsubscribed");
    });

    it("should return NotFoundError for invalid token", async () => {
      mockCommand.optOutByUnsubscribeToken.mockResolvedValue({ err: null, data: null });

      const result = await domain.unsubscribeByToken({
        token: "550e8400-e29b-41d4-a716-446655440099",
      });

      expect(result.err).toBeInstanceOf(NotFoundError);
    });
  });
});
