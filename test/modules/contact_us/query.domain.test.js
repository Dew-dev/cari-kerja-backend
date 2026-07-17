const ContactUsQueryDomain = require("../../../src/modules/contact_us/repositories/queries/domain");
const { NotFoundError, InternalServerError } = require("../../../src/helpers/errors");

describe("Contact Us Query Domain", () => {
  let domain;
  let mockQuery;

  beforeEach(() => {
    domain = new ContactUsQueryDomain({});
    mockQuery = {
      findAll: jest.fn(),
      countAll: jest.fn(),
      findOne: jest.fn(),
    };
    domain.query = mockQuery;
  });

  describe("getContactMessages", () => {
    it("should return messages with pagination when query succeeds", async () => {
      const messages = [{ id: "1", name: "John", email: "john@example.com" }];
      mockQuery.findAll.mockResolvedValue({ err: null, data: messages });
      mockQuery.countAll.mockResolvedValue({ err: null, data: "25" });

      const result = await domain.getContactMessages({ page: 2, limit: 10, search: "john" });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(messages);
      expect(result.meta).toEqual({
        page: 2,
        per_page: 10,
        total_data: 25,
        total_pages: 3,
      });
      expect(mockQuery.findAll).toHaveBeenCalledWith(2, 10, "john");
      expect(mockQuery.countAll).toHaveBeenCalledWith("john");
    });

    it("should use default page and limit when not provided", async () => {
      mockQuery.findAll.mockResolvedValue({ err: null, data: [] });
      mockQuery.countAll.mockResolvedValue({ err: null, data: "0" });

      await domain.getContactMessages({});

      expect(mockQuery.findAll).toHaveBeenCalledWith(1, 10, null);
    });

    it("should return InternalServerError when findAll fails", async () => {
      mockQuery.findAll.mockResolvedValue({ err: "db error", data: null });

      const result = await domain.getContactMessages({ page: 1, limit: 10 });

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.data).toBeNull();
    });

    it("should return InternalServerError when countAll fails", async () => {
      mockQuery.findAll.mockResolvedValue({ err: null, data: [] });
      mockQuery.countAll.mockResolvedValue({ err: "count error", data: null });

      const result = await domain.getContactMessages({ page: 1, limit: 10 });

      expect(result.err).toBeInstanceOf(InternalServerError);
    });
  });

  describe("getContactMessageById", () => {
    it("should return contact message when found", async () => {
      const message = { id: "contact-uuid", name: "John", email: "john@example.com" };
      mockQuery.findOne.mockResolvedValue({ err: null, data: message });

      const result = await domain.getContactMessageById({ id: "contact-uuid" });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(message);
      expect(mockQuery.findOne).toHaveBeenCalledWith(
        { id: "contact-uuid" },
        {
          id: 1,
          name: 1,
          email: 1,
          subject: 1,
          message: 1,
          phone: 1,
          created_at: 1,
        }
      );
    });

    it("should return NotFoundError when message not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.getContactMessageById({ id: "nonexistent" });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Contact message not found");
    });
  });
});
