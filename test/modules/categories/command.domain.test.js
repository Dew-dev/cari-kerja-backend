const CategoryDomain = require("../../../src/modules/categories/repositories/commands/domain");
const {
  NotFoundError,
  InternalServerError,
  ConflictError,
} = require("../../../src/helpers/errors");

describe("Categories Command Domain", () => {
  let domain;
  let mockCommand;
  let mockQuery;

  beforeEach(() => {
    domain = new CategoryDomain({});
    mockCommand = {
      insertOne: jest.fn(),
      deleteOne: jest.fn(),
      upsertTranslation: jest.fn().mockResolvedValue({ locale: "id", name: "Technology" }),
    };
    mockQuery = {
      findOne: jest.fn(),
      listTranslations: jest.fn().mockResolvedValue([{ locale: "id", name: "Technology" }]),
    };
    domain.command = mockCommand;
    domain.query = mockQuery;
  });

  describe("addCategory", () => {
    it("should return id when insert succeeds", async () => {
      mockCommand.insertOne.mockResolvedValue({ err: null, data: { id: 1 } });
      mockQuery.listTranslations.mockResolvedValue([{ locale: "id", name: "Technology" }]);

      const result = await domain.addCategory({ name: "Technology" });

      expect(result.err).toBeNull();
      expect(result.data).toEqual({
        id: 1,
        name: "Technology",
        translations: { id: { name: "Technology" } },
      });
      expect(mockCommand.insertOne).toHaveBeenCalledWith();
      expect(mockCommand.upsertTranslation).toHaveBeenCalledWith({
        category_id: 1,
        locale: "id",
        name: "Technology",
      });
    });

    it("should return InternalServerError when insert fails", async () => {
      mockCommand.insertOne.mockResolvedValue({ err: new Error("db error"), data: null });

      const result = await domain.addCategory({ name: "Technology" });

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Failed insert Category");
      expect(result.data).toBeNull();
    });

    it("should return ConflictError when translation name duplicates", async () => {
      mockCommand.insertOne.mockResolvedValue({ err: null, data: { id: 1 } });
      const dup = new Error("duplicate key value violates unique constraint");
      dup.code = "23505";
      mockCommand.upsertTranslation.mockRejectedValue(dup);
      mockCommand.deleteOne.mockResolvedValue({ err: null });

      const result = await domain.addCategory({ name: "Technology" });

      expect(result.err).toBeInstanceOf(ConflictError);
      expect(mockCommand.deleteOne).toHaveBeenCalledWith({ id: 1 });
    });
  });

  describe("updateCategory", () => {
    const payload = { id: 1, name: "Updated Name" };

    it("should return id when update succeeds", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: 1 } });
      mockQuery.listTranslations.mockResolvedValue([
        { locale: "id", name: "Updated Name" },
      ]);

      const result = await domain.updateCategory(payload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual({
        id: 1,
        name: "Updated Name",
        translations: { id: { name: "Updated Name" } },
      });
      expect(mockCommand.upsertTranslation).toHaveBeenCalled();
    });

    it("should return NotFoundError when category does not exist", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.updateCategory(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Category not found");
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
