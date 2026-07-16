/**
 * QA Bug-Hunting Tests — users
 * Tests assert CORRECT expected behavior. They FAIL while bugs remain in implementation.
 */
jest.mock("../../../src/helpers/auth/cookie_helper", () => ({
  storeCookie: jest.fn(),
  deleteCookie: jest.fn(),
}));

jest.mock("../../../src/helpers/queues/email.queue", () => ({
  addEmailJob: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("uuid", () => ({
  v4: jest.fn(() => "user-uuid-1234"),
}));

jest.mock("../../../src/modules/users/repositories/commands/command_handler", () => ({
  login: jest.fn(),
  registerWorker: jest.fn(),
  resendVerifyEmail: jest.fn(),
  updateOneUser: jest.fn(),
}));

jest.mock("../../../src/modules/users/repositories/queries/query_handler", () => ({
  getUserById: jest.fn(),
}));

const { storeCookie } = require("../../../src/helpers/auth/cookie_helper");
const UsersCommandDomain = require("../../../src/modules/users/repositories/commands/domain");
const apiHandler = require("../../../src/modules/users/handlers/api_handler");
const commandHandler = require("../../../src/modules/users/repositories/commands/command_handler");
const queryHandler = require("../../../src/modules/users/repositories/queries/query_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");
const {
  ConflictError,
  TooManyRequestsError,
  UnauthorizedError,
} = require("../../../src/helpers/errors");

describe("[QA] users module", () => {
  describe("Security — login should not set cookies on failure", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("[BUG-US-001] login handler must not store auth cookies when login fails", async () => {
      const req = createMockRequest({
        body: { username: "user@test.com", password: "wrongpassword" },
        headers: { "user-agent": "jest-test" },
      });
      const res = createMockResponse();

      commandHandler.login.mockResolvedValue(
        wrapper.error(new UnauthorizedError("Invalid credentials"))
      );

      await apiHandler.login(req, res);

      expect(storeCookie).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Registration — case-insensitive username duplicate check", () => {
    let domain;
    let mockQuery;
    let mockCommand;
    let mockWorkerCommand;

    beforeEach(() => {
      domain = new UsersCommandDomain({});
      mockQuery = {
        findOne: jest.fn(),
        findOneByEmail: jest.fn(),
      };
      mockCommand = {
        insertOne: jest.fn().mockResolvedValue({ err: null, data: { id: "user-uuid-1234" } }),
        invalidateEmailVerifications: jest.fn(),
        insertEmailVerification: jest.fn().mockResolvedValue({ err: null, data: true }),
      };
      mockWorkerCommand = {
        insertOne: jest.fn().mockResolvedValue({ err: null, data: { id: "worker-uuid-5678" } }),
      };
      domain.query = mockQuery;
      domain.command = mockCommand;
      domain.workerCommand = mockWorkerCommand;
    });

    it("[BUG-US-002] registerWorker should check username using normalized lowercase value", async () => {
      mockQuery.findOne
        .mockResolvedValueOnce({ err: null, data: null })
        .mockResolvedValueOnce({ err: null, data: null });

      await domain.registerWorker({
        username: "TestUser",
        password: "Password123!",
        email: "new@test.com",
        name: "Test User",
      });

      expect(mockQuery.findOne).toHaveBeenCalledWith(
        { username: "testuser" },
        { id: 1 }
      );
    });

    it("[BUG-US-003] registerWorker should return worker_id from insert result data", async () => {
      mockQuery.findOne
        .mockResolvedValueOnce({ err: null, data: null })
        .mockResolvedValueOnce({ err: null, data: null });

      const result = await domain.registerWorker({
        username: "testuser",
        password: "Password123!",
        email: "new@test.com",
        name: "Test User",
      });

      expect(result.err).toBeNull();
      expect(result.data.worker_id).toBe("worker-uuid-5678");
    });
  });

  describe("Rate limiting — resend verify email", () => {
    let domain;

    beforeEach(() => {
      domain = new UsersCommandDomain({});
      domain.query = {
        findUserByEmail: jest.fn().mockResolvedValue({
          err: null,
          data: {
            id: "user-1",
            email: "user@test.com",
            email_verified_at: null,
            name: "User",
          },
        }),
        getLatestEmailVerification: jest.fn().mockResolvedValue({ err: null, data: null }),
        countEmailVerificationsInWindow: jest.fn().mockResolvedValue({ err: null, data: 6 }),
      };
      domain.command = {
        invalidateEmailVerifications: jest.fn(),
        insertEmailVerification: jest.fn().mockResolvedValue({ err: null, data: true }),
      };
    });

    it("[BUG-US-004] resendVerifyEmail should block when hourly limit exceeded", async () => {
      const result = await domain.resendVerifyEmail({ email: "user@test.com" });

      expect(result.err).toBeInstanceOf(TooManyRequestsError);
      expect(domain.command.insertEmailVerification).not.toHaveBeenCalled();
    });

    it("[BUG-US-005] resendVerifyEmail rate limit should compare count.data not wrapper object", async () => {
      const countResult = { err: null, data: 6 };
      domain.query.countEmailVerificationsInWindow.mockResolvedValue(countResult);

      const result = await domain.resendVerifyEmail({ email: "user@test.com" });

      expect(typeof countResult.data).toBe("number");
      expect(result.err).toBeInstanceOf(TooManyRequestsError);
    });
  });

  describe("Security — getUserById has no ownership check (IDOR)", () => {
    it("[BUG-US-006] getUserById should reject access to other users profile", async () => {
      const res = createMockResponse();
      const req = createMockRequest({
        userMeta: { id: "550e8400-e29b-41d4-a716-446655440000" },
        params: { id: "550e8400-e29b-41d4-a716-446655440099" },
      });

      queryHandler.getUserById.mockResolvedValue(
        wrapper.data({ id: "550e8400-e29b-41d4-a716-446655440099", email: "other@test.com" })
      );

      await apiHandler.getUserById(req, res);

      expect(queryHandler.getUserById).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
