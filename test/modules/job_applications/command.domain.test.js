jest.mock("uuid", () => ({ v4: jest.fn(() => "application-uuid-1234") }));

const JobApplicationsCommandDomain = require("../../../src/modules/job_applications/repositories/commands/domain");
const {
  NotFoundError,
  InternalServerError,
  ForbiddenError,
} = require("../../../src/helpers/errors");

describe("Job Applications Command Domain", () => {
  const jobPostId = "550e8400-e29b-41d4-a716-446655440000";
  const workerId = "550e8400-e29b-41d4-a716-446655440001";
  const recruiterId = "550e8400-e29b-41d4-a716-446655440002";
  const applicationId = "550e8400-e29b-41d4-a716-446655440003";
  let domain;
  let mockCommand;
  let mockQuery;

  beforeEach(() => {
    domain = new JobApplicationsCommandDomain({});
    mockCommand = {
      insertOne: jest.fn(),
      insertMany: jest.fn(),
      updateOneNew: jest.fn(),
      insertApplicationNote: jest.fn(),
    };
    mockQuery = {
      findOne: jest.fn(),
      findApplicationWithRecruiter: jest.fn(),
      getNotesByApplication: jest.fn(),
    };
    domain.command = mockCommand;
    domain.query = mockQuery;
  });

  describe("createJobPost", () => {
    it("should create job post successfully", async () => {
      mockCommand.insertOne.mockResolvedValue({ err: null, data: { id: "job-uuid" } });

      const result = await domain.createJobPost({
        recruiter_id: recruiterId,
        title: "Backend Developer",
        description: "Node.js developer needed",
        employment_type_id: 1,
        experience_level_id: 2,
        salary_type_id: 1,
        salary_min: 5000,
        currency_id: 1,
        status_id: 3,
      });

      expect(result.err).toBeNull();
      expect(result.data.title).toBe("Backend Developer");
    });

    it("should return InternalServerError when insert fails", async () => {
      mockCommand.insertOne.mockResolvedValue({ err: new Error("db error"), data: null });

      const result = await domain.createJobPost({
        recruiter_id: recruiterId,
        title: "Backend Developer",
        description: "Desc",
        employment_type_id: 1,
        experience_level_id: 2,
        salary_type_id: 1,
        salary_min: 5000,
        currency_id: 1,
        status_id: 3,
      });

      expect(result.err).toBeInstanceOf(InternalServerError);
    });
  });

  describe("createJobApplication", () => {
    const payload = {
      job_post_id: jobPostId,
      worker_id: workerId,
      application_status_id: 1,
    };

    it("should create application when not duplicate", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: null });
      mockCommand.insertOne.mockResolvedValue({ err: null, data: { id: "application-uuid-1234" } });

      const result = await domain.createJobApplication(payload);

      expect(result.err).toBeNull();
      expect(result.data.job_application.worker_id).toBe(workerId);
    });

    it("should reject duplicate application", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: applicationId } });

      const result = await domain.createJobApplication(payload);

      expect(result.err).toBeInstanceOf(require("../../../src/helpers/errors").ConflictError);
      expect(result.err.message).toBe("DUPLICATE_SUBMISSION: Anda sudah melamar pekerjaan ini.");
      expect(mockCommand.insertOne).not.toHaveBeenCalled();
    });
  });

  describe("addApplicationNote", () => {
    it("should add note when recruiter owns application", async () => {
      mockQuery.findApplicationWithRecruiter.mockResolvedValue({
        err: null,
        data: { recruiter_id: recruiterId },
      });
      mockCommand.insertApplicationNote.mockResolvedValue({ err: null, data: true });

      const result = await domain.addApplicationNote({
        application_id: applicationId,
        recruiter_id: recruiterId,
        note: "Good candidate",
      });

      expect(result.err).toBeNull();
      expect(result.data).toBe("Note added");
    });

    it("should return ForbiddenError for wrong recruiter", async () => {
      mockQuery.findApplicationWithRecruiter.mockResolvedValue({
        err: null,
        data: { recruiter_id: "other-recruiter" },
      });

      const result = await domain.addApplicationNote({
        application_id: applicationId,
        recruiter_id: recruiterId,
        note: "Good candidate",
      });

      expect(result.err).toBeInstanceOf(ForbiddenError);
    });

    it("should return NotFoundError when application not found", async () => {
      mockQuery.findApplicationWithRecruiter.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.addApplicationNote({
        application_id: applicationId,
        recruiter_id: recruiterId,
        note: "Good candidate",
      });

      expect(result.err).toBeInstanceOf(NotFoundError);
    });
  });

  describe("getApplicationNotes", () => {
    it("should return notes for authorized recruiter", async () => {
      mockQuery.findApplicationWithRecruiter.mockResolvedValue({
        err: null,
        data: { recruiter_id: recruiterId },
      });
      mockQuery.getNotesByApplication.mockResolvedValue({
        err: null,
        data: [{ note: "Good candidate" }],
      });

      const result = await domain.getApplicationNotes({
        application_id: applicationId,
        recruiter_id: recruiterId,
      });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([{ note: "Good candidate" }]);
    });
  });
});
