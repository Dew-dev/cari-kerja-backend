jest.mock("../../../src/modules/languages/repositories/commands/command_handler", () => ({
  insertLanguages: jest.fn(),
  updateLanguages: jest.fn(),
  deleteLanguages: jest.fn(),
}));

jest.mock("../../../src/modules/languages/repositories/queries/query_handler", () => ({
  getAllLanguagesByWorkerId: jest.fn(),
}));

const commandHandler = require("../../../src/modules/languages/repositories/commands/command_handler");
const queryHandler = require("../../../src/modules/languages/repositories/queries/query_handler");
const apiHandler = require("../../../src/modules/languages/handlers/api_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("Languages API Handler", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";
  const languageId = "550e8400-e29b-41d4-a716-446655440001";
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

  describe("getAllLanguages", () => {
    it("should return languages on valid request", async () => {
      const req = createWorkerRequest();
      const languages = [{ id: languageId, language_name: "English" }];
      queryHandler.getAllLanguagesByWorkerId.mockResolvedValue(wrapper.data(languages));

      await apiHandler.getAllLanguages(req, res);

      expect(queryHandler.getAllLanguagesByWorkerId).toHaveBeenCalledWith({
        worker_id: workerId,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("insertLanguages", () => {
    const validBody = {
      language_name: "English",
      proficiency_level_id: 1,
      is_primary: true,
    };

    it("should insert language on valid request", async () => {
      const req = createWorkerRequest({ body: validBody });
      commandHandler.insertLanguages.mockResolvedValue(
        wrapper.data({ id: languageId }, "Success insert language", 201)
      );

      await apiHandler.insertLanguages(req, res);

      expect(commandHandler.insertLanguages).toHaveBeenCalledWith({
        worker_id: workerId,
        ...validBody,
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should return validation error when required fields missing", async () => {
      const req = createWorkerRequest({ body: { language_name: "English" } });

      await apiHandler.insertLanguages(req, res);

      expect(commandHandler.insertLanguages).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("updateLanguages", () => {
    const validBody = {
      language_name: "French",
      proficiency_level_id: 2,
      is_primary: false,
    };

    it("should update language on valid request", async () => {
      const req = createWorkerRequest({
        params: { id: languageId },
        body: validBody,
      });
      commandHandler.updateLanguages.mockResolvedValue(
        wrapper.data({ id: languageId }, "Success update language", 200)
      );

      await apiHandler.updateLanguages(req, res);

      expect(commandHandler.updateLanguages).toHaveBeenCalledWith({
        id: languageId,
        worker_id: workerId,
        ...validBody,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deleteLanguages", () => {
    it("should delete language on valid request", async () => {
      const req = createWorkerRequest({ params: { id: languageId } });
      commandHandler.deleteLanguages.mockResolvedValue(
        wrapper.data("Successfully deleted", "Success delete language", 200)
      );

      await apiHandler.deleteLanguages(req, res);

      expect(commandHandler.deleteLanguages).toHaveBeenCalledWith({
        id: languageId,
        worker_id: workerId,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error when id is missing", async () => {
      const req = createWorkerRequest({ params: {} });

      await apiHandler.deleteLanguages(req, res);

      expect(commandHandler.deleteLanguages).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
