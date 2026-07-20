const CommunicationQueryDomain = require("../../../src/modules/communication/repositories/queries/domain");
const { NotFoundError } = require("../../../src/helpers/errors");

describe("Communication Query Domain", () => {
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  const campaignId = "550e8400-e29b-41d4-a716-446655440010";
  const workerId = "550e8400-e29b-41d4-a716-446655440002";

  let domain;
  let mockQuery;

  beforeEach(() => {
    domain = new CommunicationQueryDomain({});
    mockQuery = {
      findTemplatesByRecruiter: jest.fn(),
      countCampaigns: jest.fn(),
      findCampaigns: jest.fn(),
      findCampaignById: jest.fn(),
      findRecipientsByCampaign: jest.fn(),
      findWorkerPreferences: jest.fn(),
    };
    domain.query = mockQuery;
  });

  it("should list templates for recruiter", async () => {
    mockQuery.findTemplatesByRecruiter.mockResolvedValue({
      err: null,
      data: [{ id: "tpl-1", name: "Invite" }],
    });

    const result = await domain.listTemplates({ recruiter_id: recruiterId });
    expect(result.err).toBeNull();
    expect(result.data).toHaveLength(1);
  });

  it("should return paginated campaigns", async () => {
    mockQuery.countCampaigns.mockResolvedValue({ err: null, data: 1 });
    mockQuery.findCampaigns.mockResolvedValue({
      err: null,
      data: [{ id: campaignId, subject: "Hello", total: 2, sent: 1, failed: 0, skipped: 1 }],
    });

    const result = await domain.listCampaigns({
      recruiter_id: recruiterId,
      page: 1,
      limit: 20,
    });

    expect(result.err).toBeNull();
    expect(result.meta.total).toBe(1);
  });

  it("should return campaign detail with recipients", async () => {
    mockQuery.findCampaignById.mockResolvedValue({
      err: null,
      data: {
        id: campaignId,
        subject: "Hello",
        channel: "email",
        status: "completed",
        total: 1,
        sent: 1,
        failed: 0,
        skipped: 0,
        created_at: new Date().toISOString(),
        job_post_id: null,
        body: "hidden",
        template_id: null,
        updated_at: new Date().toISOString(),
      },
    });
    mockQuery.findRecipientsByCampaign.mockResolvedValue({
      err: null,
      data: [{ application_id: "app-1", worker_name: "Budi", email: "b@x.com", status: "sent" }],
    });

    const result = await domain.getCampaign({ id: campaignId, recruiter_id: recruiterId });
    expect(result.err).toBeNull();
    expect(result.data.recipients).toHaveLength(1);
    expect(result.data.body).toBeUndefined();
  });

  it("should return worker communication preferences", async () => {
    mockQuery.findWorkerPreferences.mockResolvedValue({
      err: null,
      data: { email_opt_out: true },
    });

    const result = await domain.getWorkerPreferences({ worker_id: workerId });
    expect(result.err).toBeNull();
    expect(result.data.email_opt_out).toBe(true);
  });

  it("should return NotFoundError when campaign missing", async () => {
    mockQuery.findCampaignById.mockResolvedValue({ err: null, data: null });

    const result = await domain.getCampaign({ id: campaignId, recruiter_id: recruiterId });
    expect(result.err).toBeInstanceOf(NotFoundError);
  });
});
