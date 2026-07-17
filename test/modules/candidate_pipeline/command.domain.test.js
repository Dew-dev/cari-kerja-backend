const CandidatePipelineCommandDomain = require("../../../src/modules/candidate_pipeline/repositories/commands/domain");
const {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
} = require("../../../src/helpers/errors");

describe("Candidate Pipeline Command Domain", () => {
  const jobPostId = "550e8400-e29b-41d4-a716-446655440000";
  const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
  let domain;
  let mockCommand;
  let mockQuery;

  beforeEach(() => {
    domain = new CandidatePipelineCommandDomain({});
    mockCommand = {
      insertStage: jest.fn(),
      updateStage: jest.fn(),
      updateStagePosition: jest.fn(),
      deleteStage: jest.fn(),
    };
    mockQuery = {
      findJobPostOwner: jest.fn().mockResolvedValue({ err: null, data: { recruiter_id: recruiterId } }),
      ensureStagesForJobPost: jest.fn().mockResolvedValue({ err: null, data: [] }),
      findMaxStagePosition: jest.fn().mockResolvedValue({ err: null, data: 1 }),
      findStageById: jest.fn(),
      findStagesByJobPost: jest.fn(),
      countApplicationsByStage: jest.fn(),
    };
    domain.command = mockCommand;
    domain.query = mockQuery;
  });

  describe("createStage", () => {
    it("should create a custom stage with next available position", async () => {
      mockCommand.insertStage.mockResolvedValue({
        rows: [{ id: 7, name: "Technical Test", stage_type: "custom", position: 2, is_system: false, color: null }],
      });

      const result = await domain.createStage({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        name: "Technical Test",
        stage_type: "custom",
      });

      expect(result.err).toBeNull();
      expect(result.data.id).toBe(7);
      expect(mockCommand.insertStage).toHaveBeenCalledWith(
        expect.objectContaining({ job_post_id: jobPostId, name: "Technical Test", position: 2 }),
      );
    });

    it("should return ForbiddenError when recruiter does not own the job post", async () => {
      mockQuery.findJobPostOwner.mockResolvedValue({ err: null, data: { recruiter_id: "other-recruiter" } });

      const result = await domain.createStage({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        name: "Technical Test",
      });

      expect(result.err).toBeInstanceOf(ForbiddenError);
      expect(mockCommand.insertStage).not.toHaveBeenCalled();
    });

    it("should return ConflictError when stage name already exists", async () => {
      mockCommand.insertStage.mockRejectedValue({ code: "23505" });

      const result = await domain.createStage({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        name: "Applied",
      });

      expect(result.err).toBeInstanceOf(ConflictError);
    });
  });

  describe("updateStage", () => {
    it("should update stage fields", async () => {
      mockQuery.findStageById.mockResolvedValue({ err: null, data: { id: 2, is_system: false } });
      mockCommand.updateStage.mockResolvedValue({
        rows: [{ id: 2, name: "Screening Call", stage_type: "screening", position: 1, is_system: false, color: "#000" }],
      });

      const result = await domain.updateStage({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        stage_id: 2,
        name: "Screening Call",
      });

      expect(result.err).toBeNull();
      expect(result.data.name).toBe("Screening Call");
    });

    it("should return NotFoundError when stage does not belong to job post", async () => {
      mockQuery.findStageById.mockResolvedValue({ err: null, data: null });

      const result = await domain.updateStage({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        stage_id: 999,
        name: "X",
      });

      expect(result.err).toBeInstanceOf(NotFoundError);
    });
  });

  describe("reorderStages", () => {
    it("should reorder stages when all belong to job post", async () => {
      mockQuery.findStageById
        .mockResolvedValueOnce({ err: null, data: { id: 1 } })
        .mockResolvedValueOnce({ err: null, data: { id: 2 } });
      mockQuery.findStagesByJobPost.mockResolvedValue({
        err: null,
        data: [{ id: 2, position: 0 }, { id: 1, position: 1 }],
      });

      const result = await domain.reorderStages({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        stages: [{ id: 2, position: 0 }, { id: 1, position: 1 }],
      });

      expect(result.err).toBeNull();
      expect(mockCommand.updateStagePosition).toHaveBeenCalledTimes(2);
    });

    it("should return BadRequestError when a stage does not belong to job post", async () => {
      mockQuery.findStageById.mockResolvedValue({ err: null, data: null });

      const result = await domain.reorderStages({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        stages: [{ id: 999, position: 0 }],
      });

      expect(result.err).toBeInstanceOf(BadRequestError);
      expect(mockCommand.updateStagePosition).not.toHaveBeenCalled();
    });
  });

  describe("deleteStage", () => {
    it("should delete a custom stage without candidates", async () => {
      mockQuery.findStageById.mockResolvedValue({ err: null, data: { id: 2, is_system: false } });
      mockQuery.countApplicationsByStage.mockResolvedValue({ err: null, data: 0 });

      const result = await domain.deleteStage({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        stage_id: 2,
      });

      expect(result.err).toBeNull();
      expect(mockCommand.deleteStage).toHaveBeenCalledWith(2);
    });

    it("should reject deleting a system stage", async () => {
      mockQuery.findStageById.mockResolvedValue({ err: null, data: { id: 1, is_system: true } });

      const result = await domain.deleteStage({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        stage_id: 1,
      });

      expect(result.err).toBeInstanceOf(BadRequestError);
      expect(mockCommand.deleteStage).not.toHaveBeenCalled();
    });

    it("should reject deleting a stage that still has candidates", async () => {
      mockQuery.findStageById.mockResolvedValue({ err: null, data: { id: 2, is_system: false } });
      mockQuery.countApplicationsByStage.mockResolvedValue({ err: null, data: 3 });

      const result = await domain.deleteStage({
        job_post_id: jobPostId,
        recruiter_id: recruiterId,
        stage_id: 2,
      });

      expect(result.err).toBeInstanceOf(BadRequestError);
      expect(mockCommand.deleteStage).not.toHaveBeenCalled();
    });
  });
});
