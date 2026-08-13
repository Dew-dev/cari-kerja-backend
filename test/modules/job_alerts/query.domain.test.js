const JobAlertsQueryDomain = require("../../../src/modules/job_alerts/repositories/queries/domain");
const { NotFoundError, InternalServerError } = require("../../../src/helpers/errors");

describe("Job Alerts Query Domain", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440002";
  let domain;
  let mockQuery;

  beforeEach(() => {
    domain = new JobAlertsQueryDomain({});
    mockQuery = {
      findWorkerJobAlertsPreference: jest.fn(),
    };
    domain.query = mockQuery;
  });

  it("should report active when email exists and toggle is on", async () => {
    mockQuery.findWorkerJobAlertsPreference.mockResolvedValue({
      err: null,
      data: {
        email: "worker@example.com",
        job_alerts_enabled: true,
        job_alerts_last_sent_at: null,
      },
    });

    const result = await domain.getPreferences({ worker_id: workerId });
    expect(result.err).toBeNull();
    expect(result.data).toEqual({
      enabled: true,
      has_email: true,
      telegram_available: false,
      active: true,
      last_sent_at: null,
    });
  });

  it("should report inactive when email is missing even if toggle is on", async () => {
    mockQuery.findWorkerJobAlertsPreference.mockResolvedValue({
      err: null,
      data: {
        email: null,
        job_alerts_enabled: true,
        job_alerts_last_sent_at: null,
      },
    });

    const result = await domain.getPreferences({ worker_id: workerId });
    expect(result.data.active).toBe(false);
    expect(result.data.has_email).toBe(false);
    expect(result.data.enabled).toBe(true);
  });

  it("should return InternalServerError when preference query fails", async () => {
    mockQuery.findWorkerJobAlertsPreference.mockResolvedValue({
      err: "Error querying PostgreSQL",
      data: null,
    });

    const result = await domain.getPreferences({ worker_id: workerId });
    expect(result.err).toBeInstanceOf(InternalServerError);
  });

  it("should return NotFoundError when worker missing", async () => {
    mockQuery.findWorkerJobAlertsPreference.mockResolvedValue({ err: null, data: null });
    const result = await domain.getPreferences({ worker_id: workerId });
    expect(result.err).toBeInstanceOf(NotFoundError);
  });
});
