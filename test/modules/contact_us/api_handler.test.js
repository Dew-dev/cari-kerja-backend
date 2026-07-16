jest.mock("../../../src/modules/contact_us/repositories/commands/command_handler", () => ({
  createContactMessage: jest.fn(),
  deleteContactMessage: jest.fn(),
}));

jest.mock("../../../src/modules/contact_us/repositories/queries/query_handler", () => ({
  getContactMessages: jest.fn(),
  getContactMessageById: jest.fn(),
}));

const commandHandler = require("../../../src/modules/contact_us/repositories/commands/command_handler");
const queryHandler = require("../../../src/modules/contact_us/repositories/queries/query_handler");
const apiHandler = require("../../../src/modules/contact_us/handlers/api_handlers");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("Contact Us API Handler", () => {
  let res;

  beforeEach(() => {
    res = createMockResponse();
    jest.clearAllMocks();
  });

  describe("createContactMessage", () => {
    const validBody = {
      name: "John Doe",
      email: "john@example.com",
      subject: "Question",
      message: "Hello, I have a question.",
    };

    it("should create contact message on valid request with 201 status", async () => {
      const req = createMockRequest({ body: validBody });
      const createdData = { id: "contact-uuid", ...validBody };
      commandHandler.createContactMessage.mockResolvedValue(wrapper.data(createdData));

      await apiHandler.createContactMessage(req, res);

      expect(commandHandler.createContactMessage).toHaveBeenCalledWith(validBody);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: createdData })
      );
    });

    it("should return error when required fields are missing", async () => {
      const req = createMockRequest({ body: { name: "John" } });

      await apiHandler.createContactMessage(req, res);

      expect(commandHandler.createContactMessage).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it("should reject empty string fields", async () => {
      const req = createMockRequest({
        body: { name: "", email: "john@example.com", subject: "Q", message: "Hi" },
      });

      await apiHandler.createContactMessage(req, res);

      expect(commandHandler.createContactMessage).not.toHaveBeenCalled();
    });
  });

  describe("getContactMessages", () => {
    it("should return paginated contact messages", async () => {
      const req = createMockRequest({ query: { page: "2", limit: "20", search: "john" } });
      const messages = [{ id: "1", name: "John" }];
      const meta = { page: 2, per_page: 20, total_data: 1, total_pages: 1 };
      queryHandler.getContactMessages.mockResolvedValue(wrapper.paginationData(messages, meta));

      await apiHandler.getContactMessages(req, res);

      expect(queryHandler.getContactMessages).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        search: "john",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: messages, meta })
      );
    });

    it("should use default pagination when query params not provided", async () => {
      const req = createMockRequest({ query: {} });
      const meta = { page: 1, per_page: 10, total_data: 0, total_pages: 0 };
      queryHandler.getContactMessages.mockResolvedValue(wrapper.paginationData([], meta));

      await apiHandler.getContactMessages(req, res);

      expect(queryHandler.getContactMessages).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: null,
      });
    });
  });

  describe("getContactMessageById", () => {
    it("should return contact message by id", async () => {
      const req = createMockRequest({ params: { id: "550e8400-e29b-41d4-a716-446655440000" } });
      const message = { id: "550e8400-e29b-41d4-a716-446655440000", name: "John" };
      queryHandler.getContactMessageById.mockResolvedValue(wrapper.data(message));

      await apiHandler.getContactMessageById(req, res);

      expect(queryHandler.getContactMessageById).toHaveBeenCalledWith({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return error when id is missing", async () => {
      const req = createMockRequest({ params: {} });

      await apiHandler.getContactMessageById(req, res);

      expect(queryHandler.getContactMessageById).not.toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  describe("deleteContactMessage", () => {
    it("should delete contact message by id", async () => {
      const req = createMockRequest({ params: { id: "550e8400-e29b-41d4-a716-446655440000" } });
      commandHandler.deleteContactMessage.mockResolvedValue(
        wrapper.data({ id: "550e8400-e29b-41d4-a716-446655440000" })
      );

      await apiHandler.deleteContactMessage(req, res);

      expect(commandHandler.deleteContactMessage).toHaveBeenCalledWith({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return error when id is missing", async () => {
      const req = createMockRequest({ params: {} });

      await apiHandler.deleteContactMessage(req, res);

      expect(commandHandler.deleteContactMessage).not.toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });
});
