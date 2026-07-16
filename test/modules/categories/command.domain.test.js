const CategoryDomain = require("../../../src/modules/categories/repositories/commands/domain");
const { NotFoundError, InternalServerError } = require("../../../src/helpers/errors");

describe("Categories Command Domain", () => {
  let domain;
  let mockCommand;
  let mockQuery;

  beforeEach(() => {
    domain = new CategoryDomain({});
    mockCommand = {
      insertOne: jest.fn(),
      updateOneNew: jest.fn(),
      deleteOne: jest.fn(),
    };
    mockQuery = {
      findOne: jest.fn(),
    };
    domain.command = mockCommand;
    domain.query = mockQuery;
  });

  describe("addCategory", () => {
    it("should return id when insert succeeds", async () => {
      mockCommand.insertOne.mockResolvedValue({ err: null, data: { id: 1 } });

      const result = await domain.addCategory({ name: "Technology" });

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ id: 1 });
      expect(mockCommand.insertOne).toHaveBeenCalledWith({ name: "Technology" });
    });

    it("should return InternalServerError when insert fails", async () => {
      mockCommand.insertOne.mockResolvedValue({ err: new Error("db error"), data: null });

      const result = await domain.addCategory({ name: "Technology" });

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Failed insert Category");
      expect(result.data).toBeNull();
    });
  });

  describe("updateCategory", () => {
    const payload = { id: 1, name: "Updated Name" };

    it("should return id when update succeeds", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: 1 } });
      mockCommand.updateOneNew.mockResolvedValue({ err: null, data: { id: 1 } });

      const result = await domain.updateCategory(payload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ id: 1 });
      expect(mockCommand.updateOneNew).toHaveBeenCalledWith({ id: 1 }, { name: "Updated Name" });
    });

    it("should return NotFoundError when category does not exist", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.updateCategory(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Category not found");
      expect(mockCommand.updateOneNew).not.toHaveBeenCalled();
    });

    it("should return InternalServerError when update fails", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: 1 } });
      mockCommand.updateOneNew.mockResolvedValue({ err: new Error("update failed"), data: null });

      const result = await domain.updateCategory(payload);

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Update Category failed");
    });
  });

  describe("deleteCategory", () => {
    const payload = { id: 1 };

    it("should return success message when delete succeeds", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: 1 } });
      mockCommand.deleteOne.mockResolvedValue({ err: null, data: true });

      const result = await domain.deleteCategory(payload);

      expect(result.err).toBeNull();
      expect(result.data).toBe("Success deleted category");
      expect(mockCommand.deleteOne).toHaveBeenCalledWith({ id: 1 });
    });

    it("should return NotFoundError when category does not exist", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.deleteCategory(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Category not found");
      expect(mockCommand.deleteOne).not.toHaveBeenCalled();
    });

    it("should return InternalServerError when delete fails", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: 1 } });
      mockCommand.deleteOne.mockResolvedValue({ err: new Error("delete failed"), data: null });

      const result = await domain.deleteCategory(payload);

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Delete Category failed");
    });
  });
});
