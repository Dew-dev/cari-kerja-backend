jest.mock("../../src/helpers/queues/email.queue", () => ({
  addEmailJob: jest.fn().mockResolvedValue({ id: "email-job" }),
}));

jest.mock("../../src/helpers/queues/telegram.queue", () => ({
  addTelegramJob: jest.fn().mockResolvedValue({ id: "tg-job" }),
}));

const { addEmailJob } = require("../../src/helpers/queues/email.queue");
const { addTelegramJob } = require("../../src/helpers/queues/telegram.queue");
const {
  NotificationService,
} = require("../../src/helpers/notifications/NotificationService");

describe("NotificationService multi-channel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("queues email and telegram independently for dual-channel user", async () => {
    const service = new NotificationService();
    const result = await service.notify({
      user: {
        id: "u1",
        email: "a@test.com",
        login_provider: "telegram",
        telegram_chat_id: "123",
        name: "Ann",
      },
      type: "application_status",
      data: {
        name: "Ann",
        jobTitle: "Dev",
        status: "Interview",
        companyName: "Acme",
      },
      email: {
        to: "a@test.com",
        subject: "Update",
        html: "<p>hi</p>",
      },
    });

    expect(addEmailJob).toHaveBeenCalledTimes(1);
    expect(addTelegramJob).toHaveBeenCalledTimes(1);
    expect(result.results.some((r) => r.channel === "email" && r.queued)).toBe(
      true
    );
    expect(
      result.results.some((r) => r.channel === "telegram" && r.queued)
    ).toBe(true);
  });

  it("does not fail email when telegram channel would skip", async () => {
    const service = new NotificationService();
    addEmailJob.mockRejectedValueOnce(new Error("smtp down"));

    const result = await service.notify({
      user: {
        id: "u2",
        email: "b@test.com",
        login_provider: "local",
        name: "Bob",
      },
      type: "application_status",
      data: { name: "Bob", jobTitle: "QA", status: "Review" },
      email: {
        to: "b@test.com",
        subject: "Update",
        html: "<p>hi</p>",
      },
    });

    expect(addTelegramJob).not.toHaveBeenCalled();
    expect(result.results.find((r) => r.channel === "email")?.failed).toBe(
      true
    );
  });

  it("queues telegram only when email payload absent", async () => {
    const service = new NotificationService();
    await service.notify({
      user: {
        id: "u3",
        email: null,
        login_provider: "telegram",
        telegram_chat_id: "99",
        name: "Cara",
      },
      type: "job_alert",
      data: {
        name: "Cara",
        jobs: [{ title: "Backend", company: "Co" }],
      },
      email: null,
    });

    expect(addEmailJob).not.toHaveBeenCalled();
    expect(addTelegramJob).toHaveBeenCalledTimes(1);
    expect(addTelegramJob.mock.calls[0][0].text).toContain("Job Alert");
  });
});
