/**
 * QA Bug-Hunting Tests — worker-skills
 * Tests assert CORRECT expected behavior. They FAIL while bugs remain in implementation.
 */
jest.mock("../../../src/modules/worker-skills/repositories/commands/command_handler", () => ({
  insertWorkerSkills: jest.fn(),
  deleteWorkerSkills: jest.fn(),
}));

const WorkerSkillsCommandDomain = require("../../../src/modules/worker-skills/repositories/commands/domain");
const { ConflictError, InternalServerError } = require("../../../src/helpers/errors");

describe("[QA] worker-skills module", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";
  const skillId = "550e8400-e29b-41d4-a716-446655440001";

  describe("Response data — insert should return skill_name", () => {
    it("[BUG-WS-001] insertOne should return skill_name from joined skill data", async () => {
      const domain = new WorkerSkillsCommandDomain({});
      domain.command = {
        insertOne: jest.fn().mockResolvedValue({
          err: null,
          data: {
            worker_id: workerId,
            skill_id: skillId,
            created_at: "2024-01-01",
          },
        }),
      };
      domain.query = { findOne: jest.fn() };
      domain.skillQuery = {
        findOne: jest.fn().mockResolvedValue({
          err: null,
          data: { id: skillId, skill_name: "JavaScript" },
        }),
      };

      const result = await domain.insertOne({ worker_id: workerId, skill_id: skillId });

      expect(result.err).toBeNull();
      expect(result.data.skill_name).toBeDefined();
      expect(typeof result.data.skill_name).toBe("string");
    });
  });

  describe("Error handling — duplicate and invalid skill", () => {
    it("[BUG-WS-002] duplicate worker skill should return ConflictError", async () => {
      const domain = new WorkerSkillsCommandDomain({});
      domain.command = {
        insertOne: jest.fn().mockResolvedValue({
          err: new Error("duplicate key value violates unique constraint"),
          data: null,
        }),
      };
      domain.query = { findOne: jest.fn() };
      domain.skillQuery = {
        findOne: jest.fn().mockResolvedValue({
          err: null,
          data: { id: skillId, skill_name: "JavaScript" },
        }),
      };

      const result = await domain.insertOne({ worker_id: workerId, skill_id: skillId });

      expect(result.err).toBeInstanceOf(ConflictError);
      expect(result.err).not.toBeInstanceOf(InternalServerError);
    });

    it("[BUG-WS-003] invalid skill_id FK violation should return NotFoundError or BadRequestError", async () => {
      const domain = new WorkerSkillsCommandDomain({});
      domain.command = {
        insertOne: jest.fn().mockResolvedValue({
          err: new Error("violates foreign key constraint"),
          data: null,
        }),
      };
      domain.query = { findOne: jest.fn() };
      // Skill lookup itself succeeds here to exercise the FK-violation branch
      // inside the insert error handling, not the upfront existence check.
      domain.skillQuery = {
        findOne: jest.fn().mockResolvedValue({
          err: null,
          data: { id: "00000000-0000-0000-0000-000000000000", skill_name: "Ghost Skill" },
        }),
      };

      const result = await domain.insertOne({
        worker_id: workerId,
        skill_id: "00000000-0000-0000-0000-000000000000",
      });

      expect(result.err).not.toBeInstanceOf(InternalServerError);
      expect(result.err?.message).not.toBe("Failed to insert worker skill");
    });
  });

  describe("Query — empty list should not be 404", () => {
    it("[BUG-WS-004] getAllWorkerSkills should return empty array not NotFoundError", async () => {
      const WorkerSkillsQueryDomain = require("../../../src/modules/worker-skills/repositories/queries/domain");
      const domain = new WorkerSkillsQueryDomain({});
      domain.query = {
        getAllByWorkerId: jest.fn().mockResolvedValue({
          err: "Data Not Found Please Try Another Input",
          data: null,
        }),
      };

      const result = await domain.getAllWorkerSkillsByWorkerId({ worker_id: workerId });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
    });
  });
});
