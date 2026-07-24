const {
  buildOauthLoginErrorRedirect,
  resolveOauthErrorCode,
  extractProviderFromMessage,
} = require("../../src/helpers/auth/oauth_redirect");
const { ConflictError, BadRequestError } = require("../../src/helpers/errors");

describe("oauth_redirect helper", () => {
  it("maps ConflictError to provider_conflict", () => {
    expect(resolveOauthErrorCode(new ConflictError("x"))).toBe("provider_conflict");
    expect(resolveOauthErrorCode(new BadRequestError("x"))).toBe("oauth_failed");
  });

  it("extracts provider from conflict message", () => {
    expect(
      extractProviderFromMessage(
        "This email is already registered with local login. Please sign in with that method."
      )
    ).toBe("local");
  });

  it("builds worker login redirect with encoded query params", () => {
    const url = buildOauthLoginErrorRedirect({
      origin: "https://fe-stage.cari-kerja.co.id",
      roleId: 1,
      err: new ConflictError(
        "This email is already registered with local login. Please sign in with that method."
      ),
    });
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/login");
    expect(parsed.searchParams.get("error")).toBe("provider_conflict");
    expect(parsed.searchParams.get("provider")).toBe("local");
  });

  it("builds recruiter login path for role_id 2", () => {
    const url = buildOauthLoginErrorRedirect({
      origin: "https://fe-stage.cari-kerja.co.id",
      roleId: 2,
      err: new ConflictError("registered with telegram login"),
    });
    expect(new URL(url).pathname).toBe("/recruiter-login");
  });
});
