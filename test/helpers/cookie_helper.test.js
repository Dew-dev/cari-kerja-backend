const { storeCookie, deleteCookie } = require("../../src/helpers/auth/cookie_helper");
const { createMockResponse } = require("../helpers/httpMocks");

describe("cookie_helper cross-origin options", () => {
  it("storeCookie uses SameSite=None and Secure for cross-origin FE", () => {
    const res = createMockResponse();
    res.cookie = jest.fn().mockReturnValue(res);

    storeCookie(res, "refreshToken", "rt-value");

    expect(res.cookie).toHaveBeenCalledWith(
      "refreshToken",
      "rt-value",
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "none",
      })
    );
  });

  it("deleteCookie clears with matching SameSite/Secure", () => {
    const res = createMockResponse();
    res.clearCookie = jest.fn().mockReturnValue(res);

    deleteCookie(res, "refreshToken");

    expect(res.clearCookie).toHaveBeenCalledWith(
      "refreshToken",
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "none",
      })
    );
  });
});
