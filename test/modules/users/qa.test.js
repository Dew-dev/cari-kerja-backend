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

jest.mock("../../../src/helpers/auth/jwt_helper", () => ({
  generateAccessToken: jest.fn(async (payload) => `access:${payload.worker_id || payload.recruiter_id || "none"}`),
  generateRefreshToken: jest.fn(async () => "refresh-token"),
  verifyRefreshToken: jest.fn(),
}));

jest.mock("uuid", () => ({
  v4: jest.fn(() => "user-uuid-1234"),
}));

jest.mock("../../../src/modules/users/repositories/commands/command_handler", () => ({
  login: jest.fn(),
  registerWorker: jest.fn(),
  resendVerifyEmail: jest.fn(),
  updateOneUser: jest.fn(),
  changeEmail: jest.fn(),
}));

jest.mock("../../../src/modules/users/repositories/queries/query_handler", () => ({
  getUserById: jest.fn(),
}));

const { storeCookie } = require("../../../src/helpers/auth/cookie_helper");
const {
  generateAccessToken,
} = require("../../../src/helpers/auth/jwt_helper");
const UsersCommandDomain = require("../../../src/modules/users/repositories/commands/domain");
const apiHandler = require("../../../src/modules/users/handlers/api_handler");
const commandHandler = require("../../../src/modules/users/repositories/commands/command_handler");
const queryHandler = require("../../../src/modules/users/repositories/queries/query_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");
const {
  BadRequestError,
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
        // loginParamType expects `email` (accepts email or username value), not `username`
        body: { email: "user@test.com", password: "wrongpassword" },
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

  describe("OAuth signup — JWT must include worker_id / recruiter_id", () => {
    let domain;
    let mockQuery;
    let mockCommand;
    let mockWorkerCommand;
    let mockRecruiterCommand;

    beforeEach(() => {
      jest.clearAllMocks();
      domain = new UsersCommandDomain({});
      mockQuery = { findOne: jest.fn() };
      mockCommand = {
        insertOne: jest.fn().mockResolvedValue({ err: null, data: true }),
        insertAuditLog: jest.fn().mockResolvedValue({ err: null, data: true }),
      };
      mockWorkerCommand = {
        insertOne: jest.fn().mockResolvedValue({ err: null, data: true }),
      };
      mockRecruiterCommand = {
        insertOne: jest.fn().mockResolvedValue({ err: null, data: true }),
      };
      domain.query = mockQuery;
      domain.command = mockCommand;
      domain.workerCommand = mockWorkerCommand;
      domain.recruiterCommand = mockRecruiterCommand;
    });

    it("[BUG-US-007] loginWithGoogle new worker must pass worker_id to generateAccessToken", async () => {
      mockQuery.findOne.mockResolvedValue({ err: true, data: null });

      const result = await domain.loginWithGoogle({
        id: "google-sub-1",
        email: "new.worker@gmail.com",
        role_id: 1,
        name: "New Worker",
      });

      expect(result.err).toBeNull();
      expect(generateAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({ worker_id: "user-uuid-1234", role_id: 1 })
      );
    });

    it("[BUG-US-008] loginWithGoogle new recruiter must pass recruiter_id to generateAccessToken", async () => {
      mockQuery.findOne.mockResolvedValue({ err: true, data: null });

      const result = await domain.loginWithGoogle({
        id: "google-sub-2",
        email: "new.recruiter@gmail.com",
        role_id: 2,
        name: "New Recruiter",
      });

      expect(result.err).toBeNull();
      expect(generateAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({ recruiter_id: "user-uuid-1234", role_id: 2 })
      );
    });
  });

  describe("Telegram — change placeholder email", () => {
    let domain;

    beforeEach(() => {
      jest.clearAllMocks();
      domain = new UsersCommandDomain({});
      domain.query = {
        findOne: jest.fn().mockResolvedValue({
          err: null,
          data: {
            id: "550e8400-e29b-41d4-a716-446655440000",
            email: "telegram_123@carikerja.id",
            login_provider: "telegram",
            provider_id: "123",
            role_id: 1,
            username: "telegram_user",
          },
        }),
        findUserByEmail: jest.fn().mockResolvedValue({ err: null, data: null }),
      };
      domain.command = {
        updateOneNew: jest.fn().mockResolvedValue({ err: null, data: true }),
        clearEmailVerified: jest.fn().mockResolvedValue({ err: null, data: true }),
        invalidateEmailVerifications: jest.fn().mockResolvedValue({ err: null, data: true }),
        insertEmailVerification: jest.fn().mockResolvedValue({ err: null, data: true }),
      };
      domain.queryWorker = {
        findOne: jest.fn().mockResolvedValue({
          err: null,
          data: { id: "worker-1", name: "Telegram User" },
        }),
      };
      domain.queryRecruiter = { findOne: jest.fn() };
    });

    it("[BUG-US-009] changeEmail should update email and clear verification for telegram user", async () => {
      const result = await domain.changeEmail({
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        email: "real.user@gmail.com",
      });

      expect(result.err).toBeNull();
      expect(result.data.email).toBe("real.user@gmail.com");
      expect(result.data.requires_verification).toBe(true);
      expect(result.data.requires_email_setup).toBe(true);
      expect(domain.command.updateOneNew).toHaveBeenCalledWith(
        { id: "550e8400-e29b-41d4-a716-446655440000" },
        { email: "real.user@gmail.com" }
      );
      expect(domain.command.clearEmailVerified).toHaveBeenCalled();
      expect(generateAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "real.user@gmail.com",
          worker_id: "worker-1",
        })
      );
    });

    it("[BUG-US-010] changeEmail should reject telegram placeholder as new email", async () => {
      const result = await domain.changeEmail({
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        email: "telegram_999@carikerja.id",
      });

      expect(result.err).toBeInstanceOf(BadRequestError);
      expect(domain.command.updateOneNew).not.toHaveBeenCalled();
    });

    it("[BUG-US-011] changeEmail handler should use authenticated user id", async () => {
      commandHandler.changeEmail = jest.fn().mockResolvedValue(
        wrapper.data({
          email: "real.user@gmail.com",
          token: "new-access",
          requires_verification: true,
          requires_email_setup: true,
        })
      );

      const req = createMockRequest({
        userMeta: { id: "550e8400-e29b-41d4-a716-446655440000" },
        body: { email: "real.user@gmail.com" },
      });
      const res = createMockResponse();

      await apiHandler.changeEmail(req, res);

      expect(commandHandler.changeEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "550e8400-e29b-41d4-a716-446655440000",
          email: "real.user@gmail.com",
        })
      );
    });

    it("[BUG-US-012] changeEmail should reject google login accounts", async () => {
      domain.query.findOne.mockResolvedValue({
        err: null,
        data: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          email: "google.user@gmail.com",
          login_provider: "google",
          role_id: 1,
        },
      });

      const result = await domain.changeEmail({
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        email: "other@gmail.com",
      });

      expect(result.err).toBeInstanceOf(BadRequestError);
      expect(domain.command.updateOneNew).not.toHaveBeenCalled();
    });
  });

  describe("Telegram OAuth — purpose=link must not login", () => {
    it("[BUG-US-013] telegram callback with purpose=link redirects code to FE without login", async () => {
      const state = JSON.stringify({
        purpose: "link",
        origin: "http://localhost:5173",
      });
      const req = createMockRequest({
        method: "GET",
        query: {
          code: "oauth-code-abc",
          state,
        },
      });
      req.method = "GET";
      const res = createMockResponse();
      res.redirect = jest.fn();

      commandHandler.loginWithTelegram = jest.fn();

      await apiHandler.loginWithTelegram(req, res);

      expect(commandHandler.loginWithTelegram).not.toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith(
        "http://localhost:5173/auth/telegram-link?code=oauth-code-abc"
      );
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
