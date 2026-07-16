/**
 * QA Bug-Hunting Tests — chat
 * Tests assert CORRECT expected behavior. They FAIL while bugs remain in implementation.
 */
jest.mock("../../../src/modules/chat/repositories/commands/command_handler", () => ({
  startConversation: jest.fn(),
  sendMessage: jest.fn(),
  markAsRead: jest.fn(),
}));

jest.mock("../../../src/modules/chat/repositories/queries/query_handler", () => ({
  getConversations: jest.fn(),
  getMessages: jest.fn(),
}));

jest.mock("../../../src/helpers/socket", () => ({
  getIO: jest.fn(() => null),
}));

const ChatCommandDomain = require("../../../src/modules/chat/repositories/commands/domain");
const ChatCommand = require("../../../src/modules/chat/repositories/commands/command");
const commandModel = require("../../../src/modules/chat/repositories/commands/command_model");
const apiHandler = require("../../../src/modules/chat/handlers/api_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");
const {
  BadRequestError,
  ForbiddenError,
} = require("../../../src/helpers/errors");

describe("[QA] chat module", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  const otherWorkerId = "550e8400-e29b-41d4-a716-446655440099";
  const convId = "550e8400-e29b-41d4-a716-446655440010";

  describe("Security — participant role validation", () => {
    it("[BUG-CH-001] startConversation should reject when recruiter_id is not a recruiter account", async () => {
      const domain = new ChatCommandDomain({});
      domain.query = {
        getConversationByParticipants: jest.fn().mockResolvedValue({ err: null, data: null }),
        getConversationByIdForParticipant: jest.fn().mockResolvedValue({
          err: null,
          data: { id: convId, worker_id: workerId, recruiter_id: otherWorkerId },
        }),
      };
      domain.command = {
        createConversation: jest.fn().mockResolvedValue({ err: null, data: { id: convId } }),
      };

      const result = await domain.startConversation({
        worker_id: workerId,
        recruiter_id: otherWorkerId,
        role_id: 1,
      });

      expect(result.err).toBeInstanceOf(ForbiddenError);
      expect(domain.command.createConversation).not.toHaveBeenCalled();
    });
  });

  describe("Business logic — archived conversations", () => {
    it("[BUG-CH-002] sendMessage should reject when conversation status is ARCHIVED", async () => {
      const domain = new ChatCommandDomain({});
      domain.query = {
        getConversationByIdForParticipant: jest.fn().mockResolvedValue({
          err: null,
          data: {
            id: convId,
            worker_id: workerId,
            recruiter_id: recruiterId,
            status: "ARCHIVED",
          },
        }),
        getMessageById: jest.fn().mockResolvedValue({
          err: null,
          data: { id: "msg-1", conversation_id: convId, sender_id: workerId, message: "Hello", type: "text" },
        }),
      };
      domain.command = {
        insertMessageWithTransaction: jest.fn().mockResolvedValue({
          err: null,
          data: { id: "msg-1", conversation_id: convId, sender_id: workerId, message: "Hello", type: "text" },
        }),
      };

      const result = await domain.sendMessage({
        conversation_id: convId,
        sender_id: workerId,
        role_id: 1,
        message: "Hello",
        type: "text",
      });

      expect(result.err).toBeInstanceOf(BadRequestError);
      expect(domain.command.insertMessageWithTransaction).not.toHaveBeenCalled();
    });
  });

  describe("Concurrency — unread counter uses JWT role not participant side", () => {
    it("[BUG-CH-003] markAsRead should reset unread based on participant side not token role_id", async () => {
      const domain = new ChatCommandDomain({});
      domain.query = {
        getConversationByIdForParticipant: jest.fn().mockResolvedValue({
          err: null,
          data: { id: convId, worker_id: workerId, recruiter_id: recruiterId },
        }),
      };
      domain.command = {
        markMessagesAsRead: jest.fn().mockResolvedValue({ err: null, data: true }),
        resetUnreadCount: jest.fn().mockResolvedValue({ err: null, data: true }),
      };

      await domain.markAsRead({
        conversation_id: convId,
        user_id: recruiterId,
        role_id: 1,
      });

      expect(domain.command.resetUnreadCount).toHaveBeenCalledWith(convId, 2);
    });

    it("[BUG-CH-004] insertMessageWithTransaction should derive recipient unread from sender_id not role_id", async () => {
      const command = new ChatCommand({});
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce({ rows: [{ id: "msg-1" }] })
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce(undefined),
        release: jest.fn(),
      };
      const mockPool = { connect: jest.fn().mockResolvedValue(mockClient) };

      jest.spyOn(require("../../../src/helpers/databases/postgresql/connection"), "getConnection")
        .mockResolvedValue(mockPool);

      await command.insertMessageWithTransaction(
        {
          id: "msg-1",
          conversation_id: convId,
          sender_id: recruiterId,
          message: "Hi",
          type: "text",
        },
        1
      );

      const updateQuery = mockClient.query.mock.calls[2][0];
      expect(updateQuery).toContain("worker_unread");
    });
  });

  describe("Routing — HTTP method for mark as read", () => {
    it("[BUG-CH-005] read endpoint route should register PATCH to match handler contract", () => {
      const chatHandler = require("../../../src/modules/chat/handlers/api_handler");
      let readRouteHandler;

      const mockServer = {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn((path, ...handlers) => {
          if (path.includes("/read")) {
            readRouteHandler = handlers[handlers.length - 1];
          }
        }),
        patch: jest.fn((path, ...handlers) => {
          if (path.includes("/read")) {
            readRouteHandler = handlers[handlers.length - 1];
          }
        }),
        delete: jest.fn(),
      };

      jest.isolateModules(() => {
        jest.doMock("../../../src/middlewares/verifyToken", () => jest.fn());
        require("../../../src/routes/chat")(mockServer);
      });

      expect(mockServer.patch).toHaveBeenCalled();
      expect(readRouteHandler).toBe(chatHandler.markAsRead);
    });
  });

  describe("Validation — message type enum", () => {
    it("[BUG-CH-006] sendMessage schema should restrict type to allowed values", () => {
      const { error } = commandModel.sendMessageParamType.validate({
        conversation_id: convId,
        sender_id: workerId,
        role_id: 1,
        message: "Hello",
        type: "malicious_type",
      });
      expect(error).toBeDefined();
    });
  });

  describe("Race condition — duplicate conversation create", () => {
    it("[BUG-CH-007] startConversation should return existing conversation on unique constraint race", async () => {
      const domain = new ChatCommandDomain({});
      domain.query = {
        getConversationByParticipants: jest.fn().mockResolvedValue({ err: null, data: null }),
        getConversationByIdForParticipant: jest.fn().mockResolvedValue({
          err: null,
          data: { id: convId, worker_id: workerId, recruiter_id: recruiterId },
        }),
      };
      domain.command = {
        createConversation: jest.fn().mockResolvedValue({
          err: new Error("duplicate key value violates unique constraint"),
          data: null,
        }),
      };

      const result = await domain.startConversation({
        worker_id: workerId,
        recruiter_id: recruiterId,
        role_id: 1,
      });

      expect(result.err).toBeNull();
      expect(result.data).toBeDefined();
    });
  });

  describe("Handler — worker cannot impersonate recruiter on start", () => {
    it("[BUG-CH-008] worker startConversation should validate recruiter_id exists as recruiter", async () => {
      const commandHandler = require("../../../src/modules/chat/repositories/commands/command_handler");
      const res = createMockResponse();
      const req = createMockRequest({
        userMeta: { id: workerId, role_id: 1 },
        body: { recruiter_id: otherWorkerId },
      });

      commandHandler.startConversation.mockResolvedValue(
        wrapper.data({ id: convId }, "success", 201)
      );

      await apiHandler.startConversation(req, res);

      expect(commandHandler.startConversation).not.toHaveBeenCalledWith(
        expect.objectContaining({ recruiter_id: otherWorkerId })
      );
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
