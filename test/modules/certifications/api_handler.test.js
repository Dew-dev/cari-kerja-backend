jest.mock("../../../src/modules/certifications/repositories/queries/query_handler", () => ({
  getOneCertification: jest.fn(),
  getAllCertifications: jest.fn(),
}));

jest.mock("../../../src/modules/certifications/repositories/commands/command_handler", () => ({
  addCertification: jest.fn(),
  updateCertification: jest.fn(),
  deleteCertification: jest.fn(),
}));

const queryHandler = require("../../../src/modules/certifications/repositories/queries/query_handler");
const commandHandler = require("../../../src/modules/certifications/repositories/commands/command_handler");
const apiHandler = require("../../../src/modules/certifications/handlers/api_handlers");
const { createMockRequest, createMockResponse } = require("../../helpers/httpMocks");
const wrapper = require("../../../src/helpers/utils/wrapper");

describe("Certifications API Handler", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";
  const certId = "550e8400-e29b-41d4-a716-446655440001";
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

  describe("getOneCertification", () => {
    it("should return certification on valid request", async () => {
      const req = createWorkerRequest({ params: { id: certId } });
      const certData = { id: certId, name: "AWS" };
      queryHandler.getOneCertification.mockResolvedValue(wrapper.data(certData));

      await apiHandler.getOneCertification(req, res);

      expect(queryHandler.getOneCertification).toHaveBeenCalledWith({
        id: certId,
        worker_id: workerId,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error for missing id", async () => {
      const req = createWorkerRequest({ params: {} });

      await apiHandler.getOneCertification(req, res);

      expect(queryHandler.getOneCertification).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getAllCertifications", () => {
    it("should return paginated certifications", async () => {
      const req = createWorkerRequest({ query: { page: "1", limit: "10" } });
      const certs = [{ id: certId, name: "AWS" }];
      const meta = { page: 1, per_page: 10, total_data: 1, total_pages: 1 };
      queryHandler.getAllCertifications.mockResolvedValue(wrapper.paginationData(certs, meta));

      await apiHandler.getAllCertifications(req, res);

      expect(queryHandler.getAllCertifications).toHaveBeenCalledWith({
        worker_id: workerId,
        page: 1,
        limit: 10,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("addCertification", () => {
    const validBody = {
      name: "AWS Solutions Architect",
      issuer: "Amazon",
      link: "https://aws.amazon.com",
      issue_date: "2024-01-01",
      is_active: true,
    };

    it("should create certification on valid request", async () => {
      const req = createWorkerRequest({ body: validBody });
      commandHandler.addCertification.mockResolvedValue(wrapper.data({ id: certId }));

      await apiHandler.addCertification(req, res);

      expect(commandHandler.addCertification).toHaveBeenCalledWith({
        worker_id: workerId,
        ...validBody,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should strip created_at and updated_at from payload before validation", async () => {
      const req = createWorkerRequest({
        body: { ...validBody, created_at: "2024-01-01", updated_at: "2024-01-02" },
      });
      commandHandler.addCertification.mockResolvedValue(wrapper.data({ id: certId }));

      await apiHandler.addCertification(req, res);

      expect(commandHandler.addCertification).toHaveBeenCalledWith({
        worker_id: workerId,
        ...validBody,
      });
    });

    it("should return validation error when required fields missing", async () => {
      const req = createWorkerRequest({ body: { name: "AWS" } });

      await apiHandler.addCertification(req, res);

      expect(commandHandler.addCertification).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("updateCertification", () => {
    it("should update certification on valid request", async () => {
      const req = createWorkerRequest({
        params: { id: certId },
        body: { name: "Updated", link: "https://example.com" },
      });
      commandHandler.updateCertification.mockResolvedValue(wrapper.data({ name: "Updated" }));

      await apiHandler.updateCertification(req, res);

      expect(commandHandler.updateCertification).toHaveBeenCalledWith({
        id: certId,
        worker_id: workerId,
        name: "Updated",
        link: "https://example.com",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should strip created_at, updated_at, and isSaved from payload", async () => {
      const req = createWorkerRequest({
        params: { id: certId },
        body: {
          name: "Updated",
          link: "https://example.com",
          created_at: "2024-01-01",
          updated_at: "2024-01-02",
          isSaved: true,
        },
      });
      commandHandler.updateCertification.mockResolvedValue(wrapper.data({ name: "Updated" }));

      await apiHandler.updateCertification(req, res);

      expect(commandHandler.updateCertification).toHaveBeenCalledWith({
        id: certId,
        worker_id: workerId,
        name: "Updated",
        link: "https://example.com",
      });
    });
  });

  describe("deleteCertification", () => {
    it("should delete certification on valid request", async () => {
      const req = createWorkerRequest({ params: { id: certId } });
      commandHandler.deleteCertification.mockResolvedValue(
        wrapper.data("Success deleted certification")
      );

      await apiHandler.deleteCertification(req, res);

      expect(commandHandler.deleteCertification).toHaveBeenCalledWith({
        id: certId,
        worker_id: workerId,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return validation error when id is missing", async () => {
      const req = createWorkerRequest({ params: {} });

      await apiHandler.deleteCertification(req, res);

      expect(commandHandler.deleteCertification).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
