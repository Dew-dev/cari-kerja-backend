const RecruitersCommandDomain = require("../../../src/modules/recruiters/repositories/commands/domain");
const {
  NotFoundError,
  InternalServerError,
} = require("../../../src/helpers/errors");

describe("Recruiters Command Domain", () => {
  let domain;
  let mockCommand;
  let mockQuery;

  beforeEach(() => {
    domain = new RecruitersCommandDomain({});
    mockCommand = {
      updateOneNew: jest.fn(),
    };
    mockQuery = {
      findOne: jest.fn(),
    };
    domain.command = mockCommand;
    domain.query = mockQuery;
  });

  describe("updateOneRecruiter", () => {
    const payload = {
      id: "recruiter-uuid",
      user_id: "user-uuid",
      company_name: "Acme Corp",
      contact_phone: "08123456789",
      industry_id: 1,
    };

    it("should return id when update succeeds with only defined fields", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "recruiter-uuid" } });
      mockCommand.updateOneNew.mockResolvedValue({ err: null, data: true });

      const result = await domain.updateOneRecruiter(payload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual({ id: "recruiter-uuid" });
      expect(mockCommand.updateOneNew).toHaveBeenCalledWith(
        { id: "recruiter-uuid" },
        {
          company_name: "Acme Corp",
          contact_phone: "08123456789",
          industry_id: 1,
        }
      );
    });

    it("should skip undefined and null fields", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "recruiter-uuid" } });
      mockCommand.updateOneNew.mockResolvedValue({ err: null, data: true });

      await domain.updateOneRecruiter({
        id: "recruiter-uuid",
        user_id: "user-uuid",
        company_name: "Acme Corp",
        avatar_url: null,
      });

      expect(mockCommand.updateOneNew).toHaveBeenCalledWith(
        { id: "recruiter-uuid" },
        { company_name: "Acme Corp" }
      );
    });

    it("should return NotFoundError when recruiter not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.updateOneRecruiter(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Recruiter Not Found!");
      expect(mockCommand.updateOneNew).not.toHaveBeenCalled();
    });

    it("should return InternalServerError when update fails", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "recruiter-uuid" } });
      mockCommand.updateOneNew.mockResolvedValue({ err: new Error("update failed"), data: null });

      const result = await domain.updateOneRecruiter(payload);

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Update Recruiter Failed");
    });
  });

  describe("updateRecruiterVip", () => {
    const payload = {
      id: "recruiter-uuid",
      user_id: "user-uuid",
      is_vip: true,
      vip_start_at: new Date("2024-01-01"),
      vip_end_at: new Date("2025-01-01"),
    };

    it("should return vip data when update succeeds", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "recruiter-uuid" } });
      mockCommand.updateOneNew.mockResolvedValue({ err: null, data: true });

      const result = await domain.updateRecruiterVip(payload);

      expect(result.err).toBeNull();
      expect(result.data).toEqual(
        expect.objectContaining({
          id: "recruiter-uuid",
          is_vip: true,
          vip_start_at: payload.vip_start_at,
          vip_end_at: payload.vip_end_at,
        })
      );
    });

    it("should set vip dates to null when is_vip is false", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "recruiter-uuid" } });
      mockCommand.updateOneNew.mockResolvedValue({ err: null, data: true });

      const result = await domain.updateRecruiterVip({
        id: "recruiter-uuid",
        user_id: "user-uuid",
        is_vip: false,
      });

      expect(result.err).toBeNull();
      expect(result.data.is_vip).toBe(false);
      expect(result.data.vip_start_at).toBeNull();
      expect(result.data.vip_end_at).toBeNull();
    });

    it("should use current date as vip_start_at when is_vip and start not provided", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "recruiter-uuid" } });
      mockCommand.updateOneNew.mockResolvedValue({ err: null, data: true });

      const before = new Date();
      const result = await domain.updateRecruiterVip({
        id: "recruiter-uuid",
        user_id: "user-uuid",
        is_vip: true,
      });
      const after = new Date();

      expect(result.err).toBeNull();
      expect(result.data.vip_start_at.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.data.vip_start_at.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("should return NotFoundError when recruiter not found", async () => {
      mockQuery.findOne.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.updateRecruiterVip(payload);

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("Recruiter Not Found!");
    });

    it("should return InternalServerError when update fails", async () => {
      mockQuery.findOne.mockResolvedValue({ err: null, data: { id: "recruiter-uuid" } });
      mockCommand.updateOneNew.mockResolvedValue({ err: new Error("update failed"), data: null });

      const result = await domain.updateRecruiterVip(payload);

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.err.message).toBe("Update Recruiter VIP Failed");
    });
  });
});
