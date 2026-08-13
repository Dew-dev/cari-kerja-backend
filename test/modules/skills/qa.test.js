/**
 * QA Bug-Hunting Tests — skills
 * Tests assert CORRECT expected behavior. They FAIL while bugs remain in implementation.
 */
const SkillsCommandDomain = require("../../../src/modules/skills/repositories/commands/domain");
const SkillsQueryDomain = require("../../../src/modules/skills/repositories/queries/domain");
const {
  ConflictError,
  InternalServerError,
} = require("../../../src/helpers/errors");

jest.mock("uuid", () => ({
  v4: jest.fn(() => "skill-uuid-1234"),
}));

describe("[QA] skills module", () => {
  describe("Field naming — skill_name vs skills_name", () => {
    let domain;
    let mockCommand;
    let mockQuery;

    beforeEach(() => {
      domain = new SkillsCommandDomain({});
      mockCommand = {
        insertOne: jest.fn(),
        updateOneNew: jest.fn().mockResolvedValue({ err: null, data: true }),
        deleteOne: jest.fn(),
      };
      mockQuery = {
        findOne: jest.fn().mockResolvedValue({ err: null, data: { id: "skill-1" } }),
        findAllSkills: jest.fn(),
        countAllSkills: jest.fn(),
      };
      domain.command = mockCommand;
      domain.query = mockQuery;
    });

    it("[BUG-SK-001] updateSkill should persist skill_name column from payload.skill_name", async () => {
      await domain.updateSkill({ id: "skill-1", skill_name: "TypeScript" });

      expect(mockCommand.updateOneNew).toHaveBeenCalledWith(
        { id: "skill-1" },
        { skill_name: "TypeScript" }
      );
    });

    it("[BUG-SK-002] getOneSkill should query projection using skill_name not skills_name", async () => {
      const queryDomain = new SkillsQueryDomain({});
      queryDomain.query = mockQuery;
      mockQuery.findOne.mockResolvedValue({
        err: null,
        data: { id: "skill-1", skill_name: "JavaScript", created_at: "2024-01-01" },
      });

      await queryDomain.getOneSkill({ id: "skill-1" });

      expect(mockQuery.findOne).toHaveBeenCalledWith(
        { id: "skill-1" },
        { id: 1, skill_name: 1, created_at: 1 }
      );
    });

    it("[BUG-SK-003] update domain must use skill_name key matching command model", async () => {
      await domain.updateSkill({ id: "skill-1", skill_name: "React" });

      const updatePayload = mockCommand.updateOneNew.mock.calls[0][1];
      expect(updatePayload).toHaveProperty("skill_name", "React");
      expect(updatePayload.skills_name).toBeUndefined();
    });
  });

  describe("Error handling — duplicate skill", () => {
    it("[BUG-SK-004] duplicate skill insert should return ConflictError", async () => {
      const domain = new SkillsCommandDomain({});
      domain.command = {
        insertOne: jest.fn().mockResolvedValue({
          err: new Error("duplicate key value violates unique constraint"),
          data: null,
        }),
      };
      domain.query = { findOne: jest.fn() };

      const result = await domain.addSkill({ skill_name: "JavaScript" });

      expect(result.err).toBeInstanceOf(ConflictError);
      expect(result.err).not.toBeInstanceOf(InternalServerError);
    });
  });

  describe("Pagination — count error and invalid limit", () => {
    it("[BUG-SK-005] getAllSkills should return error when count query fails", async () => {
      const domain = new SkillsQueryDomain({});
      domain.query = {
        findAllSkills: jest.fn().mockResolvedValue({ err: null, data: [{ id: "1" }] }),
        countAllSkills: jest.fn().mockResolvedValue({ err: new Error("count failed"), data: null }),
      };

      const result = await domain.getAllSkills({ page: 1, limit: 10, search: "" });

      expect(result.err).toBeInstanceOf(InternalServerError);
      expect(result.meta).toBeUndefined();
    });

    it("[BUG-SK-006] getAllSkills meta should not produce NaN/Infinity when limit is 0", async () => {
      const domain = new SkillsQueryDomain({});
      domain.query = {
        findAllSkills: jest.fn().mockResolvedValue({ err: null, data: [] }),
        countAllSkills: jest.fn().mockResolvedValue({ err: null, data: 10 }),
      };

      const result = await domain.getAllSkills({ page: 1, limit: 0, search: "" });

      expect(Number.isFinite(result.meta.total_pages)).toBe(true);
      expect(result.meta.total_pages).not.toBe(Infinity);
    });
  });
});
