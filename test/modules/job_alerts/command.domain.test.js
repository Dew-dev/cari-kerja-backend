jest.mock("../../../src/helpers/queues/email.queue", () => ({
  addEmailJob: jest.fn().mockResolvedValue(undefined),
}));

const JobAlertsCommandDomain = require("../../../src/modules/job_alerts/repositories/commands/domain");
const { addEmailJob } = require("../../../src/helpers/queues/email.queue");
const {
  NotFoundError,
  BadRequestError,
} = require("../../../src/helpers/errors");

describe("Job Alerts Command Domain", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440002";
  let domain;
  let mockCommand;
  let mockQuery;

  beforeEach(() => {
    domain = new JobAlertsCommandDomain({});
    mockCommand = {
      updateJobAlertsEnabled: jest.fn(),
      markJobAlertsSent: jest.fn().mockResolvedValue({ err: null, data: { id: workerId } }),
    };
    mockQuery = {
      findWorkerJobAlertsPreference: jest.fn(),
      findEligibleWorkers: jest.fn(),
      findMatchingJobsForWorker: jest.fn(),
    };
    domain.command = mockCommand;
    domain.query = mockQuery;
    jest.clearAllMocks();
  });

  describe("updatePreferences", () => {
    it("should enable job alerts when worker has email", async () => {
      mockQuery.findWorkerJobAlertsPreference.mockResolvedValue({
        err: null,
        data: { email: "worker@example.com", job_alerts_enabled: false },
      });
      mockCommand.updateJobAlertsEnabled.mockResolvedValue({
        err: null,
        data: { job_alerts_enabled: true },
      });

      const result = await domain.updatePreferences({
        worker_id: workerId,
        enabled: true,
      });

      expect(result.err).toBeNull();
      expect(result.data).toEqual({
        enabled: true,
        has_email: true,
        telegram_available: false,
        active: true,
      });
    });

    it("should reject toggle when worker has no email", async () => {
      mockQuery.findWorkerJobAlertsPreference.mockResolvedValue({
        err: null,
        data: { email: null, job_alerts_enabled: true },
      });

      const result = await domain.updatePreferences({
        worker_id: workerId,
        enabled: true,
      });

      expect(result.err).toBeInstanceOf(BadRequestError);
      expect(mockCommand.updateJobAlertsEnabled).not.toHaveBeenCalled();
    });

    it("should return NotFoundError for missing worker", async () => {
      mockQuery.findWorkerJobAlertsPreference.mockResolvedValue({ err: null, data: null });

      const result = await domain.updatePreferences({
        worker_id: workerId,
        enabled: false,
      });

      expect(result.err).toBeInstanceOf(NotFoundError);
    });
  });

  describe("runDailyJobAlerts", () => {
    it("should enqueue email for workers with matching jobs", async () => {
      mockQuery.findEligibleWorkers
        .mockResolvedValueOnce({
          err: null,
          data: [
            {
              worker_id: workerId,
              worker_name: "Budi",
              email: "budi@example.com",
              expected_salary: 10000000,
            },
          ],
        })
        .mockResolvedValueOnce({ err: null, data: [] });

      mockQuery.findMatchingJobsForWorker.mockResolvedValue({
        err: null,
        data: [
          {
            id: "550e8400-e29b-41d4-a716-446655440010",
            title: "Backend Developer",
            company_name: "EGI",
            location: "Jakarta",
            salary_min: 8000000,
            salary_max: 12000000,
            currency: "IDR",
          },
        ],
      });

      const result = await domain.runDailyJobAlerts();

      expect(result.err).toBeNull();
      expect(result.data.sent).toBe(1);
      expect(addEmailJob).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "budi@example.com",
          subject: expect.stringContaining("rekomendasi lowongan"),
        }),
      );
      expect(mockCommand.markJobAlertsSent).toHaveBeenCalledWith(workerId);
    });

    it("should skip workers with no matching jobs", async () => {
      mockQuery.findEligibleWorkers
        .mockResolvedValueOnce({
          err: null,
          data: [
            {
              worker_id: workerId,
              worker_name: "Budi",
              email: "budi@example.com",
            },
          ],
        })
        .mockResolvedValueOnce({ err: null, data: [] });

      mockQuery.findMatchingJobsForWorker.mockResolvedValue({ err: null, data: [] });

      const result = await domain.runDailyJobAlerts();

      expect(result.data.sent).toBe(0);
      expect(result.data.skipped).toBe(1);
      expect(addEmailJob).not.toHaveBeenCalled();
      expect(mockCommand.markJobAlertsSent).toHaveBeenCalledWith(workerId);
    });
  });
});
