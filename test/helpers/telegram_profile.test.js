const {
  createTelegramStartPayload,
  verifyTelegramStartPayload,
  buildTelegramProfileFields,
  resolvePublicTelegramUsername,
  omitSensitiveTelegramFields,
} = require("../../src/helpers/auth/telegram_profile");

describe("telegram_profile helper", () => {
  it("signs and verifies start payload under Telegram 64-char limit", () => {
    const userId = "550e8400-e29b-41d4-a716-446655440000";
    const payload = createTelegramStartPayload(userId);
    expect(payload.length).toBeLessThanOrEqual(64);
    expect(payload).not.toMatch(/-/); // compact uuid, no dashes in id segment
    const verified = verifyTelegramStartPayload(payload);
    expect(verified).toEqual({ userId });
  });

  it("rejects tampered start payload", () => {
    const payload = createTelegramStartPayload("550e8400-e29b-41d4-a716-446655440000");
    const [a, b, sig] = payload.split(".");
    expect(verifyTelegramStartPayload(`${a}.${b}.${sig}x`)).toBeNull();
  });

  it("rejects empty or legacy oversized payload", () => {
    expect(verifyTelegramStartPayload("")).toBeNull();
    expect(
      verifyTelegramStartPayload(
        "NTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAwLjE3ODUwNDcwNDUuVk8tbzdFNVpXakxRSU40Qw"
      )
    ).toBeNull();
  });

  it("resolves public username and ignores synthetic telegram_id username", () => {
    expect(
      resolvePublicTelegramUsername({ username: "telegram_12345" })
    ).toBeNull();
    expect(
      resolvePublicTelegramUsername({
        username: "telegram_12345",
        telegram_notify_username: "realuser",
      })
    ).toBe("realuser");
  });

  it("builds self profile fields without exposing chat_id", () => {
    const fields = buildTelegramProfileFields(
      {
        id: "u1",
        login_provider: "telegram",
        telegram_chat_id: "999",
        telegram_notify_username: "alice",
        name: "Alice",
      },
      { forSelf: true, displayName: "Alice" }
    );
    expect(fields).toMatchObject({
      telegram_connected: true,
      telegram_available: true,
      telegram_username: "alice",
      telegram_display_name: "Alice",
      telegram_bot_start_url: null,
    });
    expect(fields).not.toHaveProperty("telegram_chat_id");
  });

  it("builds recruiter chat url when available", () => {
    const fields = buildTelegramProfileFields(
      {
        login_provider: "telegram",
        telegram_chat_id: "1",
        telegram_notify_username: "bob",
      },
      { forSelf: false }
    );
    expect(fields.telegram_chat_url).toBe("https://t.me/bob");
  });

  it("omits sensitive fields", () => {
    const clean = omitSensitiveTelegramFields({
      name: "x",
      telegram_chat_id: "secret",
      provider_id: "secret2",
    });
    expect(clean).toEqual({ name: "x" });
  });
});
