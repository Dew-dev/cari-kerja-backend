jest.mock("../../../src/modules/educations/repositories/commands/command_handler", () => ({
  insertEducations: jest.fn(),
  updateEducations: jest.fn(),
  deleteEducations: jest.fn(),
}));

jest.mock("../../../src/modules/educations/repositories/queries/query_handler", () => ({
  getEducationsById: jest.fn(),
  getAllEducationsByWorkerId: jest.fn(),
}));

const commandHandler = require("../../../src/modules/educations/repositories/commands/command_handler");
const queryHandler = require("../../../src/modules/educations/repositories/queries/query_handler");
const apiHandler = require("../../../src/modules/educations/handlers/api_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("Educations API Handler", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";
  const educationId = "550e8400-e29b-41d4-a716-446655440001";
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

  describe("getEducationsById", () => {
    it("should return education on valid request", async () => {
      const req = createWorkerRequest({ params: { id: educationId } });
      const education = { id: educationId, institution_name: "University" };
      queryHandler.getEducationsById.mockResolvedValue(wrapper.data(education));

      await apiHandler.getEducationsById(req, res);

      expect(queryHandler.getEducationsById).toHaveBeenCalledWith({
        id: educationId,
        worker_id: workerId,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error for invalid uuid", async () => {
      const req = createWorkerRequest({ params: { id: "invalid" } });

      await apiHandler.getEducationsById(req, res);

      expect(queryHandler.getEducationsById).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getAllEducations", () => {
    it("should return all educations for worker", async () => {
      const req = createWorkerRequest();
      const educations = [{ id: educationId, institution_name: "University" }];
      queryHandler.getAllEducationsByWorkerId.mockResolvedValue(wrapper.data(educations));

      await apiHandler.getAllEducations(req, res);

      expect(queryHandler.getAllEducationsByWorkerId).toHaveBeenCalledWith({
        worker_id: workerId,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("insertEducations", () => {
    const validBody = {
      institution_name: "University of Indonesia",
      degree: "Bachelor",
      major: "Computer Science",
      start_date: "2018-09-01",
      end_date: "2022-06-01",
      is_current: false,
    };

    it("should insert education on valid request", async () => {
      const req = createWorkerRequest({ body: validBody });
      commandHandler.insertEducations.mockResolvedValue(
        wrapper.data({ id: educationId })
      );

      await apiHandler.insertEducations(req, res);

      expect(commandHandler.insertEducations).toHaveBeenCalledWith({
        worker_id: workerId,
        ...validBody,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error when required fields are missing", async () => {
      const req = createWorkerRequest({ body: {} });

      await apiHandler.insertEducations(req, res);

      expect(commandHandler.insertEducations).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("updateEducations", () => {
    const validBody = {
      institution_name: "Updated University",
      degree: "Master",
      major: "Data Science",
      start_date: "2022-09-01",
      end_date: "2024-06-01",
      is_current: false,
    };

    it("should update education on valid request", async () => {
      const req = createWorkerRequest({
        params: { id: educationId },
        body: validBody,
      });
      commandHandler.updateEducations.mockResolvedValue(
        wrapper.data({ id: educationId })
      );

      await apiHandler.updateEducations(req, res);

      expect(commandHandler.updateEducations).toHaveBeenCalledWith({
        id: educationId,
        worker_id: workerId,
        ...validBody,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should strip created_at and updated_at from payload", async () => {
      const req = createWorkerRequest({
        params: { id: educationId },
        body: { ...validBody, created_at: "2024-01-01", updated_at: "2024-01-02" },
      });
      commandHandler.updateEducations.mockResolvedValue(
        wrapper.data({ id: educationId })
      );

      await apiHandler.updateEducations(req, res);

      expect(commandHandler.updateEducations).toHaveBeenCalledWith({
        id: educationId,
        worker_id: workerId,
        ...validBody,
      });
    });

    it("should return validation error when required fields missing", async () => {
      const req = createWorkerRequest({
        params: { id: educationId },
        body: { institution_name: "University" },
      });

      await apiHandler.updateEducations(req, res);

      expect(commandHandler.updateEducations).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("deleteEducations", () => {
    it("should delete education on valid request", async () => {
      const req = createWorkerRequest({ params: { id: educationId } });
      commandHandler.deleteEducations.mockResolvedValue(
        wrapper.data("Successfully deleted")
      );

      await apiHandler.deleteEducations(req, res);

      expect(commandHandler.deleteEducations).toHaveBeenCalledWith({
        id: educationId,
        worker_id: workerId,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should accept string id without uuid validation on delete", async () => {
      const req = createWorkerRequest({ params: { id: "custom-id" } });
      commandHandler.deleteEducations.mockResolvedValue(
        wrapper.data("Successfully deleted")
      );

      await apiHandler.deleteEducations(req, res);

      expect(commandHandler.deleteEducations).toHaveBeenCalledWith({
        id: "custom-id",
        worker_id: workerId,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error when id is missing", async () => {
      const req = createWorkerRequest({ params: {} });

      await apiHandler.deleteEducations(req, res);

      expect(commandHandler.deleteEducations).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
