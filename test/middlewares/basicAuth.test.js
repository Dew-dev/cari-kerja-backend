jest.mock("../../src/config/global_config", () => {
  const confidence = require("confidence");
  const store = new confidence.Store({
    basicAuth: { username: "test-user", password: "test-pass" },
  });
  return store;
});

const basicAuth = require("../../src/middlewares/basicAuth");
const { createMockRequest, createMockResponse } = require("../helpers/httpMocks");

describe("basicAuth middleware", () => {
  const username = "test-user";
  const password = "test-pass";

  const getSentPayload = (res) => res.send.mock.calls[0]?.[0];

  it("returns 401 Basic authentication required when Authorization header missing", async () => {
    const req = createMockRequest({ headers: {} });
    const res = createMockResponse();
    const next = jest.fn();

    await basicAuth.isAuthenticated(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(getSentPayload(res)).toMatchObject({
      success: false,
      message: "Basic authentication required",
      code: 401,
    });
  });

  it("returns 401 Invalid basic credentials when credentials wrong", async () => {
    const bad = Buffer.from("wrong:creds").toString("base64");
    const req = createMockRequest({
      headers: { authorization: `Basic ${bad}` },
    });
    const res = createMockResponse();
    const next = jest.fn();

    await basicAuth.isAuthenticated(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(getSentPayload(res)).toMatchObject({
      success: false,
      message: "Invalid basic credentials",
      code: 401,
    });
  });

  it("calls next when Basic credentials are valid", async () => {
    const ok = Buffer.from(`${username}:${password}`).toString("base64");
    const req = createMockRequest({
      headers: { authorization: `Basic ${ok}` },
    });
    const res = createMockResponse();
    const next = jest.fn();

    await basicAuth.isAuthenticated(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  it("does not use session-expired phrasing Token is not valid", async () => {
    const req = createMockRequest({ headers: {} });
    const res = createMockResponse();
    await basicAuth.isAuthenticated(req, res, jest.fn());
    expect(getSentPayload(res).message).not.toBe("Token is not valid");
  });
});
