jest.mock("../../../src/modules/resumes/repositories/commands/command_handler", () => ({
  addResume: jest.fn(),
  updateResume: jest.fn(),
  deleteResume: jest.fn(),
}));

jest.mock("../../../src/modules/resumes/repositories/queries/query_handler", () => ({
  getResume: jest.fn(),
  getAllResumes: jest.fn(),
}));

const commandHandler = require("../../../src/modules/resumes/repositories/commands/command_handler");
const queryHandler = require("../../../src/modules/resumes/repositories/queries/query_handler");
const apiHandler = require("../../../src/modules/resumes/handlers/api_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("Resumes API Handler", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";
  const resumeId = "550e8400-e29b-41d4-a716-446655440001";
  let res;

  beforeEach(() => {
    res = createMockResponse();
    jest.clearAllMocks();
  });

  const createWorkerRequest = (overrides = {}) =>
    createMockRequest({
      userMeta: { worker_id: workerId },
      ...overrides,
    });

  describe("getResume", () => {
    it("should return resume on valid request", async () => {
      const req = createWorkerRequest({ params: { id: resumeId } });
      const resume = { id: resumeId, title: "My CV" };
      queryHandler.getResume.mockResolvedValue(wrapper.data(resume));

      await apiHandler.getResume(req, res);

      expect(queryHandler.getResume).toHaveBeenCalledWith({
        id: resumeId,
        worker_id: workerId,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error when id is missing", async () => {
      const req = createWorkerRequest({ params: {} });

      await apiHandler.getResume(req, res);

      expect(queryHandler.getResume).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getAllResumes", () => {
    it("should return paginated resumes", async () => {
      const req = createWorkerRequest({ query: { page: "1", limit: "10" } });
      const resumes = [{ id: resumeId, title: "My CV" }];
      queryHandler.getAllResumes.mockResolvedValue(
        wrapper.paginationData(resumes, {
          page: 1,
          per_page: 10,
          total_data: 1,
          total_pages: 1,
        })
      );

      await apiHandler.getAllResumes(req, res);

      expect(queryHandler.getAllResumes).toHaveBeenCalledWith({
        worker_id: workerId,
        page: 1,
        limit: 10,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("addResume", () => {
    const validBody = {
      title: "My CV",
      is_default: false,
    };

    it("should add resume with file upload path", async () => {
      const req = createWorkerRequest({
        body: validBody,
        file: { filename: "cv.pdf" },
      });
      commandHandler.addResume.mockResolvedValue(wrapper.data({ id: resumeId }));

      await apiHandler.addResume(req, res);

      expect(commandHandler.addResume).toHaveBeenCalledWith({
        worker_id: workerId,
        ...validBody,
        resume_url: "/uploads/resumes/cv.pdf",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error when resume_url missing and no file", async () => {
      const req = createWorkerRequest({ body: validBody });

      await apiHandler.addResume(req, res);

      expect(commandHandler.addResume).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("updateResume", () => {
    it("should update resume on valid request", async () => {
      const req = createWorkerRequest({
        params: { id: resumeId },
        body: { title: "Updated CV" },
      });
      commandHandler.updateResume.mockResolvedValue(wrapper.data({ id: resumeId }));

      await apiHandler.updateResume(req, res);

      expect(commandHandler.updateResume).toHaveBeenCalledWith({
        id: resumeId,
        worker_id: workerId,
        title: "Updated CV",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deleteResume", () => {
    it("should delete resume on valid request", async () => {
      const req = createWorkerRequest({ params: { id: resumeId } });
      commandHandler.deleteResume.mockResolvedValue(wrapper.data("Success deleted resume"));

      await apiHandler.deleteResume(req, res);

      expect(commandHandler.deleteResume).toHaveBeenCalledWith({ id: resumeId });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error when id is missing", async () => {
      const req = createWorkerRequest({ params: {} });

      await apiHandler.deleteResume(req, res);

      expect(commandHandler.deleteResume).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
