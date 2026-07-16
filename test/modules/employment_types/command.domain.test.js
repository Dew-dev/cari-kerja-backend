const EmploymentTypesCommandDomain = require("../../../src/modules/employment_types/repositories/commands/domain");
const { NotFoundError, InternalServerError } = require("../../../src/helpers/errors");

describe("Employment Types Command Domain", () => {
  let domain;
  let mockCommand;
  let mockQuery;

  beforeEach(() => {
    domain = new EmploymentTypesCommandDomain({});
    mockCommand = {
      insertOne: jest.fn(),
      updateOneNew: jest.fn(),
      deleteOne: jest.fn(),
    };
    mockQuery = { findOne: jest.fn() };
    domain.command = mockCommand;
    domain.query = mockQuery;
  });

  describe("addEmploymentType", () => {
    it("should return id when insert succeeds", async () => {
      mockCommand.insertOne.mockResolvedValue({ err: null, data: { id: 1 } });

      const result = await domain.addEmploymentType({ name: "Full Time" });

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ id: 1 });
      expect(mockCommand.insertOne).toHaveBeenCalledWith({ name: "Full Time" });
    });

    it("should return InternalServerError when insert fails", async () => {
      mockCommand.insertOne.mockResolvedValue({ err: new Error("db error"), data: null });

      const result = await domain.addEmploymentType({ name: "Full Time" });

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Failed insert EmploymentTypes");
    });
  });

  describe("updateEmploymentType", () => {
    const payload = { id: 1, name: "Part Time" };

    it("should return id when update succeeds", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: 1 } });
      mockCommand.updateOneNew.mockResolvedValue({ err: null, data: { id: 1 } });

      const result = await domain.updateEmploymentType(payload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ id: 1 });
      expect(mockCommand.updateOneNew).toHaveBeenCalledWith({ id: 1 }, { name: "Part Time" });
    });

    it("should return NotFoundError when employment type not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.updateEmploymentType(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Employment Type not found");
      expect(mockCommand.updateOneNew).not.toHaveBeenCalled();
    });

    it("should return InternalServerError when update fails", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: 1 } });
      mockCommand.updateOneNew.mockResolvedValue({ err: new Error("update failed"), data: null });

      const result = await domain.updateEmploymentType(payload);

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Update EmploymentTypes failed");
    });
  });

  describe("deleteEmploymentType", () => {
    it("should return success message when delete succeeds", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: 1 } });
      mockCommand.deleteOne.mockResolvedValue({ err: null, data: true });

      const result = await domain.deleteEmploymentType({ id: 1 });

      expect(result.err).toBeNull();
      expect(result.data).toBe("Success deleted EmploymentType");
      expect(mockCommand.deleteOne).toHaveBeenCalledWith({ id: 1 });
    });

    it("should return NotFoundError when employment type not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.deleteEmploymentType({ id: 1 });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("EmploymentType not found");
    });

    it("should return InternalServerError when delete fails", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: 1 } });
      mockCommand.deleteOne.mockResolvedValue({ err: new Error("delete failed"), data: null });

      const result = await domain.deleteEmploymentType({ id: 1 });

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Delete EmploymentType failed");
    });
  });
});
