jest.mock("../../../src/modules/categories/repositories/queries/query_handler", () => ({
  getCategory: jest.fn(),
  getAllCategories: jest.fn(),
  getAllCategoriesWithJobcount: jest.fn(),
}));

jest.mock("../../../src/modules/categories/repositories/commands/command_handler", () => ({
  addCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
}));

const queryHandler = require("../../../src/modules/categories/repositories/queries/query_handler");
const commandHandler = require("../../../src/modules/categories/repositories/commands/command_handler");
const apiHandler = require("../../../src/modules/categories/handlers/api_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("Categories API Handler", () => {
  let res;

  beforeEach(() => {
    res = createMockResponse();
    jest.clearAllMocks();
  });

  describe("getCategory", () => {
    it("should return category on valid request", async () => {
      const req = createMockRequest({ params: { id: "1" } });
      const categoryData = { id: 1, name: "Technology" };
      queryHandler.getCategory.mockResolvedValue(wrapper.data(categoryData));

      await apiHandler.getCategory(req, res);

      expect(queryHandler.getCategory).toHaveBeenCalledWith({ id: 1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: categoryData })
      );
    });

    it("should return validation error for invalid id", async () => {
      const req = createMockRequest({ params: { id: "invalid" } });

      await apiHandler.getCategory(req, res);

      expect(queryHandler.getCategory).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  describe("getAllCategories", () => {
    it("should return paginated categories on valid request", async () => {
      const req = createMockRequest({ query: { page: "1", limit: "10", search: "tech" } });
      const categories = [{ id: 1, name: "Technology" }];
      const meta = { page: 1, per_page: 10, total_data: 1, total_pages: 1 };
      queryHandler.getAllCategories.mockResolvedValue(wrapper.paginationData(categories, meta));

      await apiHandler.getAllCategories(req, res);

      expect(queryHandler.getAllCategories).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: "tech",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: categories, meta })
      );
    });

    it("should return validation error for invalid query params", async () => {
      const req = createMockRequest({ query: { page: "invalid" } });

      await apiHandler.getAllCategories(req, res);

      expect(queryHandler.getAllCategories).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getAllCategoriesWithJobcount", () => {
    it("should return categories with job count", async () => {
      const req = createMockRequest();
      const data = [{ id: 1, name: "Technology", job_count: 5 }];
      queryHandler.getAllCategoriesWithJobcount.mockResolvedValue(wrapper.data(data));

      await apiHandler.getAllCategoriesWithJobcount(req, res);

      expect(queryHandler.getAllCategoriesWithJobcount).toHaveBeenCalledWith({
        locale: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("addCategory", () => {
    it("should create category on valid request", async () => {
      const req = createMockRequest({ body: { name: "Technology" } });
      commandHandler.addCategory.mockResolvedValue(wrapper.data({ id: 1 }));

      await apiHandler.addCategory(req, res);

      expect(commandHandler.addCategory).toHaveBeenCalledWith({ name: "Technology" });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error when name is missing", async () => {
      const req = createMockRequest({ body: {} });

      await apiHandler.addCategory(req, res);

      expect(commandHandler.addCategory).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("updateCategory", () => {
    it("should update category on valid request", async () => {
      const req = createMockRequest({ params: { id: "1" }, body: { name: "Updated" } });
      commandHandler.updateCategory.mockResolvedValue(wrapper.data({ id: 1 }));

      await apiHandler.updateCategory(req, res);

      expect(commandHandler.updateCategory).toHaveBeenCalledWith({ id: 1, name: "Updated" });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error when name is missing", async () => {
      const req = createMockRequest({ params: { id: "1" }, body: {} });

      await apiHandler.updateCategory(req, res);

      expect(commandHandler.updateCategory).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("deleteCategory", () => {
    it("should delete category on valid request", async () => {
      const req = createMockRequest({ params: { id: "1" } });
      commandHandler.deleteCategory.mockResolvedValue(wrapper.data("Success deleted category"));

      await apiHandler.deleteCategory(req, res);

      expect(commandHandler.deleteCategory).toHaveBeenCalledWith({ id: 1 });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error for invalid id", async () => {
      const req = createMockRequest({ params: { id: "invalid" } });

      await apiHandler.deleteCategory(req, res);

      expect(commandHandler.deleteCategory).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
