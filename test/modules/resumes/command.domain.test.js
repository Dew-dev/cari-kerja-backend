jest.mock("uuid", () => ({
  v4: jest.fn(() => "resume-uuid-1234"),
}));

const ResumesCommandDomain = require("../../../src/modules/resumes/repositories/commands/domain");
const {
  NotFoundError,
  InternalServerError,
  BadRequestError,
} = require("../../../src/helpers/errors");

describe("Resumes Command Domain", () => {
  let domain;
  let mockCommand;
  let mockQuery;
  let mockQueryWorker;

  beforeEach(() => {
    domain = new ResumesCommandDomain({});
    mockCommand = {
      insertOne: jest.fn(),
      updateOneNew: jest.fn(),
      deleteOne: jest.fn(),
    };
    mockQuery = {
      findOne: jest.fn(),
    };
    mockQueryWorker = {
      findOne: jest.fn(),
    };
    domain.command = mockCommand;
    domain.query = mockQuery;
    domain.queryWorker = mockQueryWorker;
  });

  describe("addResume", () => {
    const payload = {
      worker_id: "550e8400-e29b-41d4-a716-446655440000",
      resume_url: "/uploads/resumes/cv.pdf",
      title: "My CV",
      is_default: false,
    };

    it("should return data when insert succeeds", async () => {
      mockQueryWorker.findOne.mockResolvedValue({ err: null, data: { id: payload.worker_id } });
      mockCommand.insertOne.mockResolvedValue({
        err: null,
        data: { id: "resume-uuid-1234" },
      });

      const result = await domain.addResume(payload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ id: "resume-uuid-1234" });
      expect(mockCommand.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "resume-uuid-1234",
          worker_id: payload.worker_id,
          resume_url: payload.resume_url,
          title: payload.title,
        })
      );
    });

    it("should unset previous default resume when is_default is true", async () => {
      mockQueryWorker.findOne.mockResolvedValue({ err: null, data: { id: payload.worker_id } });
      mockQuery.findOne
        .mockResolvedValueOnce({ err: null, data: { id: "old-default-id" } })
        .mockResolvedValueOnce({ err: null, data: { id: "old-default-id" } });
      mockCommand.updateOneNew.mockResolvedValue({ err: null, data: true });
      mockCommand.insertOne.mockResolvedValue({
        err: null,
        data: { id: "resume-uuid-1234" },
      });

      const result = await domain.addResume({ ...payload, is_default: true });

      expect(result.err).toBeNull();
      expect(mockCommand.updateOneNew).toHaveBeenCalledWith(
        { id: "old-default-id", worker_id: payload.worker_id },
        { is_default: false }
      );
    });

    it("should return NotFoundError when worker not found", async () => {
      mockQueryWorker.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.addResume(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Worker not found");
      expect(mockCommand.insertOne).not.toHaveBeenCalled();
    });

    it("should return InternalServerError when unsetting old default fails", async () => {
      mockQueryWorker.findOne.mockResolvedValue({ err: null, data: { id: payload.worker_id } });
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "old-default-id" } });
      mockCommand.updateOneNew.mockResolvedValue({ err: new Error("update failed"), data: null });

      const result = await domain.addResume({ ...payload, is_default: true });

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Update old resume error");
    });

    it("should return InternalServerError when insert fails", async () => {
      mockQueryWorker.findOne.mockResolvedValue({ err: null, data: { id: payload.worker_id } });
      mockCommand.insertOne.mockResolvedValue({ err: new Error("insert failed"), data: null });

      const result = await domain.addResume(payload);

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Failed insert resume");
    });
  });

  describe("updateResume", () => {
    const payload = {
      id: "resume-uuid-1234",
      worker_id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Updated CV",
    };

    it("should return id when update succeeds", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: payload.id, is_default: false } });
      mockCommand.updateOneNew.mockResolvedValue({ err: null, data: true });

      const result = await domain.updateResume(payload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ id: payload.id });
      expect(mockCommand.updateOneNew).toHaveBeenCalledWith(
        { id: payload.id },
        { title: "Updated CV" }
      );
    });

    it("should return BadRequestError when id is missing", async () => {
      const result = await domain.updateResume({ worker_id: payload.worker_id, title: "Updated" });

      expect(result.err).toBeInstanceOf(BadRequestError);
      expect(result.err.message).toBe("Id not define");
    });

    it("should return NotFoundError when resume not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.updateResume(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Resume not found");
    });

    it("should return BadRequestError when no updatable fields provided", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: payload.id } });

      const result = await domain.updateResume({
        id: payload.id,
        worker_id: payload.worker_id,
      });

      expect(result.err).toBeInstanceOf(BadRequestError);
      expect(result.err.message).toBe("Tidak ada data untuk diupdate");
    });

    it("should unset previous default when setting is_default true", async () => {
      mockQuery.findOne
        .mockResolvedValueOnce({ err: null, data: { id: payload.id, is_default: false } })
        .mockResolvedValueOnce({ err: null, data: { id: "other-default" } });
      mockCommand.updateOneNew
        .mockResolvedValueOnce({ err: null, data: true })
        .mockResolvedValueOnce({ err: null, data: true });

      const result = await domain.updateResume({ ...payload, is_default: true });

      expect(result.err).toBeNull();
      expect(mockCommand.updateOneNew).toHaveBeenNthCalledWith(
        1,
        { id: "other-default", worker_id: payload.worker_id },
        { is_default: false }
      );
    });
  });

  describe("deleteResume", () => {
    const payload = { id: "resume-uuid-1234" };

    it("should return success message when delete succeeds", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: payload.id } });
      mockCommand.deleteOne.mockResolvedValue({ err: null, data: true });

      const result = await domain.deleteResume(payload);

      expect(result.err).toBeNull();
      expect(result.data).toBe("Success deleted resume");
    });

    it("should return NotFoundError when resume not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.deleteResume(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("resume not found");
    });

    it("should return InternalServerError when delete fails", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: payload.id } });
      mockCommand.deleteOne.mockResolvedValue({ err: new Error("delete failed"), data: null });

      const result = await domain.deleteResume(payload);

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Delete resume failed");
    });
  });
});
