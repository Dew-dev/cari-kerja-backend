const queryModel = require("../../../src/modules/contact_us/repositories/queries/query_model");

describe("Contact Us Query Model", () => {
  describe("getContactMessagesParamType", () => {
    it("should validate with defaults", () => {
      const { error, value } = queryModel.getContactMessagesParamType.validate({});
      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
      expect(value.limit).toBe(10);
    });

    it("should validate custom pagination and search", () => {
      const { error, value } = queryModel.getContactMessagesParamType.validate({
        page: 3,
        limit: 20,
        search: "john",
      });
      expect(error).toBeUndefined();
      expect(value).toEqual({ page: 3, limit: 20, search: "john" });
    });

    it("should reject page less than 1", () => {
      const { error } = queryModel.getContactMessagesParamType.validate({ page: 0 });
      expect(error).toBeDefined();
    });

    it("should reject limit less than 1", () => {
      const { error } = queryModel.getContactMessagesParamType.validate({ limit: 0 });
      expect(error).toBeDefined();
    });

    it("should allow null search", () => {
      const { error, value } = queryModel.getContactMessagesParamType.validate({ search: null });
      expect(error).toBeUndefined();
      expect(value.search).toBeNull();
    });
  });

  describe("getContactMessageByIdParamType", () => {
    it("should validate valid uuid", () => {
      const { error, value } = queryModel.getContactMessageByIdParamType.validate({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(error).toBeUndefined();
      expect(value.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should reject invalid uuid", () => {
      const { error } = queryModel.getContactMessageByIdParamType.validate({ id: "invalid" });
      expect(error).toBeDefined();
    });

    it("should reject missing id", () => {
      const { error } = queryModel.getContactMessageByIdParamType.validate({});
      expect(error).toBeDefined();
    });
  });
});
