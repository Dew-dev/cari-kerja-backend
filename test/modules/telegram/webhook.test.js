jest.mock("../../../src/config/global_config", () => ({
  get: jest.fn((key) => {
    const map = {
      "/telegramBot/webhookSecret": "test-webhook-secret",
      "/telegramBot/token": "bot-token",
      "/telegramBot/username": "TestBot",
      "/telegramBot/startPayloadTtlSec": 3600,
      "/jwt/accessTokenSecret": "jwt-secret",
    };
    return map[key];
  }),
}));

jest.mock("../../../src/helpers/notifications/telegram/TelegramNotificationService", () => ({
  isConfigured: jest.fn(() => false),
  sendMessage: jest.fn(),
}));

const TelegramDomain = require("../../../src/modules/telegram/repositories/commands/domain");
const {
  createTelegramStartPayload,
} = require("../../../src/helpers/auth/telegram_profile");
const { UnauthorizedError } = require("../../../src/helpers/errors");

describe("Telegram webhook domain", () => {
  const userId = "550e8400-e29b-41d4-a716-446655440000";

  it("rejects invalid webhook secret", async () => {
    const domain = new TelegramDomain({});
    const result = await domain.handleWebhook({
      update: {},
      secretToken: "wrong",
    });
    expect(result.err).toBeInstanceOf(UnauthorizedError);
  });

  it("links chat on valid /start payload", async () => {
    const linkTelegramBot = jest.fn().mockResolvedValue({
      rows: [{ id: userId }],
    });
    const domain = new TelegramDomain({});
    domain.command.linkTelegramBot = linkTelegramBot;
    domain._safeReply = jest.fn().mockResolvedValue(undefined);

    const payload = createTelegramStartPayload(userId);
    const result = await domain.handleWebhook({
      secretToken: "test-webhook-secret",
      update: {
        message: {
          text: `/start ${payload}`,
          chat: { id: 42 },
          from: { username: "alice" },
        },
      },
    });

    expect(result.err).toBeNull();
    expect(linkTelegramBot).toHaveBeenCalledWith({
      userId,
      chatId: 42,
      username: "alice",
    });
    expect(domain._safeReply).toHaveBeenCalled();
  });

  it("unlinks on /stop", async () => {
    const unlink = jest.fn().mockResolvedValue({ rows: [{ id: userId }] });
    const domain = new TelegramDomain({});
    domain.command.unlinkTelegramBotByChatId = unlink;
    domain._safeReply = jest.fn().mockResolvedValue(undefined);

    await domain.handleWebhook({
      secretToken: "test-webhook-secret",
      update: {
        message: {
          text: "/stop",
          chat: { id: 99 },
          from: {},
        },
      },
    });

    expect(unlink).toHaveBeenCalledWith(99);
  });

  it("links via provider_id when /start has no payload (mobile deep-link drop)", async () => {
    const linkByProvider = jest.fn().mockResolvedValue({
      rows: [{ id: userId }],
    });
    const domain = new TelegramDomain({});
    domain.command.linkTelegramBotByProviderId = linkByProvider;
    domain._safeReply = jest.fn().mockResolvedValue(undefined);

    const result = await domain.handleWebhook({
      secretToken: "test-webhook-secret",
      update: {
        message: {
          text: "/start",
          chat: { id: 8939532826, type: "private" },
          from: { username: "worker1" },
        },
      },
    });

    expect(result.err).toBeNull();
    expect(linkByProvider).toHaveBeenCalledWith({
      providerId: "8939532826",
      chatId: 8939532826,
      username: "worker1",
    });
    expect(domain._safeReply.mock.calls[0][1]).toContain("Notifikasi Telegram aktif");
  });
});
