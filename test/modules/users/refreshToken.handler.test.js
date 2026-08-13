/**
 * refresh-token handler: failed refresh must not overwrite cookies.
 */
jest.mock("../../../src/helpers/auth/cookie_helper", () => ({
  storeCookie: jest.fn(),
  deleteCookie: jest.fn(),
}));

jest.mock("../../../src/modules/users/repositories/commands/command_handler", () => ({
  refreshToken: jest.fn(),
}));

const { storeCookie } = require("../../../src/helpers/auth/cookie_helper");
const commandHandler = require("../../../src/modules/users/repositories/commands/command_handler");
const apiHandler = require("../../../src/modules/users/handlers/api_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");
const { ForbiddenError } = require("../../../src/helpers/errors");

describe("refreshToken handler cookie safety", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not storeCookie when refresh fails", async () => {
    commandHandler.refreshToken.mockResolvedValue(
      wrapper.error(new ForbiddenError("Refresh Token is not valid"))
    );
    const req = createMockRequest({
      body: { refreshToken: "bad-refresh" },
      cookies: {},
    });
    const res = createMockResponse();

    await apiHandler.refreshToken(req, res);

    expect(storeCookie).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalled();
  });

  it("stores refresh cookie on success using body token when response omits refreshToken", async () => {
    commandHandler.refreshToken.mockResolvedValue(
      wrapper.data({
        token: "new-access",
        user: { id: "u1", role: "user" },
      })
    );
    const req = createMockRequest({
      body: { refreshToken: "existing-refresh" },
      cookies: {},
    });
    const res = createMockResponse();

    await apiHandler.refreshToken(req, res);

    expect(storeCookie).toHaveBeenCalledWith(
      res,
      "refreshToken",
      "existing-refresh"
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          token: "new-access",
          user: expect.objectContaining({ id: "u1" }),
        }),
      })
    );
  });
});
