/**
 * QA Bug-Hunting Tests — contact_us
 * Tests assert CORRECT expected behavior. They FAIL while bugs remain in implementation.
 */
jest.mock("uuid", () => ({
  v4: jest.fn(() => "contact-uuid-1234"),
}));

jest.mock("../../../src/helpers/queues/email.queue", () => ({
  addEmailJob: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../src/modules/contact_us/repositories/commands/command_handler", () => ({
  createContactMessage: jest.fn(),
  deleteContactMessage: jest.fn(),
}));

jest.mock("../../../src/modules/contact_us/repositories/queries/query_handler", () => ({
  getContactMessages: jest.fn(),
  getContactMessageById: jest.fn(),
}));

const { addEmailJob } = require("../../../src/helpers/queues/email.queue");
const ContactUsCommandDomain = require("../../../src/modules/contact_us/repositories/commands/domain");
const ContactUsQueryDomain = require("../../../src/modules/contact_us/repositories/queries/domain");
const apiHandler = require("../../../src/modules/contact_us/handlers/api_handlers");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const { NotFoundError } = require("../../../src/helpers/errors");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("[QA] contact_us module", () => {
  const contactId = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MAIL_USER = "admin@example.com";
  });

  describe("Security — admin routes require authentication", () => {
    it("[BUG-CU-001] GET /contact-us route should require admin auth middleware", () => {
      let middlewares = [];

      const mockServer = {
        post: jest.fn(),
        get: jest.fn((path, ...handlers) => {
          if (path === "/api/v1/contact-us") {
            middlewares = handlers.slice(0, -1);
          }
        }),
        delete: jest.fn(),
      };

      jest.isolateModules(() => {
        require("../../../src/routes/contact_us")(mockServer);
      });

      expect(middlewares.length).toBeGreaterThan(0);
      const middlewareNames = middlewares.map((fn) => fn.name || String(fn));
      expect(middlewareNames.some((name) => /verify|admin|auth|token/i.test(name))).toBe(true);
    });
  });

  describe("Validation — handler should use Joi schema", () => {
    it("[BUG-CU-002] createContactMessage handler should reject invalid email via schema", async () => {
      const res = createMockResponse();
      const req = createMockRequest({
        body: {
          name: "John Doe",
          email: "not-an-email",
          subject: "Hello",
          message: "Test message",
        },
      });

      await apiHandler.createContactMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Security — XSS in admin notification email", () => {
    it("[BUG-CU-003] createContactMessage email html should escape script tags in message", async () => {
      const domain = new ContactUsCommandDomain({});
      domain.command = {
        insertOne: jest.fn().mockResolvedValue({
          err: null,
          data: { id: contactId, name: "Attacker", email: "a@test.com" },
        }),
      };

      await domain.createContactMessage({
        name: "Attacker",
        email: "attacker@test.com",
        subject: "Test",
        message: "<script>alert('xss')</script>",
      });

      const emailCall = addEmailJob.mock.calls[0][0];
      expect(emailCall.html).not.toMatch(/<script>/i);
      expect(emailCall.html).toMatch(/&lt;script&gt;|alert\('xss'\)/);
    });
  });

  describe("Validation — pagination bounds in handler", () => {
    it("[BUG-CU-004] getContactMessages handler should reject negative page via schema", async () => {
      const res = createMockResponse();
      const req = createMockRequest({ query: { page: "-1", limit: "10" } });
      const queryHandler = require("../../../src/modules/contact_us/repositories/queries/query_handler");

      queryHandler.getContactMessages.mockResolvedValue(
        wrapper.paginationData([], { page: 1, per_page: 10, total_data: 0, total_pages: 0 })
      );

      await apiHandler.getContactMessages(req, res);

      expect(queryHandler.getContactMessages).not.toHaveBeenCalledWith(
        expect.objectContaining({ page: -1 })
      );
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Business logic — delete should verify existence", () => {
    it("[BUG-CU-005] deleteContactMessage should return NotFoundError when id does not exist", async () => {
      const domain = new ContactUsCommandDomain({});
      domain.command = {
        deleteOne: jest.fn().mockResolvedValue({ err: null, data: null }),
      };
      domain.query = {
        findOne: jest.fn().mockResolvedValue({ err: new Error("not found"), data: null }),
      };

      const result = await domain.deleteContactMessage({ id: contactId });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(domain.command.deleteOne).not.toHaveBeenCalled();
    });
  });

  describe("Query — projection must not use SELECT *", () => {
    it("[BUG-CU-006] getContactMessageById should query explicit columns not wildcard", async () => {
      const domain = new ContactUsQueryDomain({});
      domain.query = {
        findOne: jest.fn().mockResolvedValue({
          err: null,
          data: { id: contactId, name: "John", email: "john@test.com" },
        }),
      };

      await domain.getContactMessageById({ id: contactId });

      expect(domain.query.findOne).toHaveBeenCalledWith(
        { id: contactId },
        expect.not.objectContaining({ "*": 1 })
      );
      expect(domain.query.findOne.mock.calls[0][1]).toHaveProperty("id", 1);
      expect(domain.query.findOne.mock.calls[0][1]).toHaveProperty("email", 1);
    });
  });

  describe("Validation — handler should use query model", () => {
    it("[BUG-CU-007] getContactMessages handler should reject invalid page query param", async () => {
      const res = createMockResponse();
      const req = createMockRequest({ query: { page: "not-a-number", limit: "10" } });
      const queryHandler = require("../../../src/modules/contact_us/repositories/queries/query_handler");

      await apiHandler.getContactMessages(req, res);

      expect(queryHandler.getContactMessages).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Validation — subject max length enforced at handler", () => {
    it("[BUG-CU-008] createContactMessage handler should reject oversized subject", async () => {
      const res = createMockResponse();
      const req = createMockRequest({
        body: {
          name: "John Doe",
          email: "john@example.com",
          subject: "s".repeat(300),
          message: "Valid message body",
        },
      });

      await apiHandler.createContactMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
