const Command = require("./command");
const Query = require("../queries/query");
const SkillQuery = require("../../../skills/repositories/queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, InternalServerError, BadRequestError, ConflictError } = require("../../../../helpers/errors");
const { enqueueRecomputeWorkerMatches } = require("../../../../helpers/queues/matching.queue");
const ctx = "WorkerSkills-Domain";

class WorkerSkills {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
    this.skillQuery = new SkillQuery(db);
  }

    // INSERT one worker skill
    async insertOne(payload) {
        const { worker_id, skill_id } = payload;

        // Validate the skill exists first so we can surface a proper NotFoundError
        // instead of relying on a raw FK violation, and reuse its name in the response.
        const skill = await this.skillQuery.findOne({ id: skill_id }, { id: 1, skill_name: 1 });
        if (skill.err) {
          return wrapper.error(new NotFoundError("Skill not found"));
        }

        const document = { worker_id, skill_id };

        const result = await this.command.insertOne(document);
        if (result.err) {
          const message = result.err.message || "";
          const isDuplicate =
            result.err.code === "23505" || /duplicate key|unique constraint/i.test(message);
          if (isDuplicate) {
            return wrapper.error(new ConflictError("Worker already has this skill"));
          }

          const isForeignKeyViolation =
            result.err.code === "23503" || /foreign key constraint/i.test(message);
          if (isForeignKeyViolation) {
            return wrapper.error(new NotFoundError("Skill not found"));
          }

          logger.error(ctx, "insertOne", "Failed to insert worker skill", result.err);
          return wrapper.error(new InternalServerError("Failed to insert worker skill"));
        }

        await enqueueRecomputeWorkerMatches(worker_id);

        return wrapper.data({
          skill_id: result.data.skill_id,
          worker_id: result.data.worker_id,
          skill_name: skill.data.skill_name,
        });
    }

    // DELETE one worker skill
    async deleteOne(payload) {
        const { worker_id, skill_id } = payload;

        const existing = await this.query.findOne({ worker_id, skill_id }, { worker_id: 1, skill_id: 1 });
        if (existing.err) {
            return wrapper.error(new NotFoundError("Worker skill not found"));
        }

        const result = await this.command.deleteOne({ worker_id, skill_id });
        if (result.err) {
          return wrapper.error(new InternalServerError("Failed to delete worker skill"));
        }

        await enqueueRecomputeWorkerMatches(worker_id);

        return wrapper.data("Successfully deleted");
    }
}

module.exports = WorkerSkills;
