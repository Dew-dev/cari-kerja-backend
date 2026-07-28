jest.mock("../../../src/modules/work-experiences/repositories/commands/command_handler", () => ({
  insertWorkExperience: jest.fn(),
  updateWorkExperience: jest.fn(),
  deleteWorkExperience: jest.fn(),
}));

jest.mock("../../../src/modules/work-experiences/repositories/queries/query_handler", () => ({
  getWorkExperienceById: jest.fn(),
  getAllWorkExperiencesByWorkerId: jest.fn(),
}));

const commandHandler = require("../../../src/modules/work-experiences/repositories/commands/command_handler");
const apiHandler = require("../../../src/modules/work-experiences/handlers/api_handler");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("Work Experiences API Handler", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";
  const expId = "550e8400-e29b-41d4-a716-446655440001";
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

  const validBody = {
    company_name: "Acme",
    job_title: "Engineer",
    category_id: 1,
    start_date: "2020-01-01",
    end_date: null,
    is_current: true,
    description: null,
  };

  describe("insertWorkExperience", () => {
    it("should insert work experience on valid request", async () => {
      const req = createWorkerRequest({ body: validBody });
      commandHandler.insertWorkExperience.mockResolvedValue(wrapper.data({ id: expId }));

      await apiHandler.insertWorkExperience(req, res);

      expect(commandHandler.insertWorkExperience).toHaveBeenCalledWith({
        worker_id: workerId,
        ...validBody,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should strip _pending from payload before validation", async () => {
      const req = createWorkerRequest({ body: { ...validBody, _pending: true } });
      commandHandler.insertWorkExperience.mockResolvedValue(wrapper.data({ id: expId }));

      await apiHandler.insertWorkExperience(req, res);

      expect(commandHandler.insertWorkExperience).toHaveBeenCalledWith({
        worker_id: workerId,
        ...validBody,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("updateWorkExperience", () => {
    it("should strip _pending from payload before validation", async () => {
      const req = createWorkerRequest({
        params: { id: expId },
        body: { ...validBody, _pending: true },
      });
      commandHandler.updateWorkExperience.mockResolvedValue(wrapper.data({ id: expId }));

      await apiHandler.updateWorkExperience(req, res);

      expect(commandHandler.updateWorkExperience).toHaveBeenCalledWith({
        id: expId,
        worker_id: workerId,
        ...validBody,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
