const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, InternalServerError, BadRequestError } = require("../../../../helpers/errors");
const ctx = "WorkerSkills-Domain";

class WorkerSkills {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

    // INSERT one worker skill
    async insertOne(payload) {
        const document = {
            worker_id: payload.worker_id,
            skill_id: payload.skill_id,
            created_at: new Date(),
        };

        const result = await this.command.insertOne(document);
        if (!result.data) {
            return wrapper.error(new InternalServerError("Failed to insert worker skill"));
        }
        return wrapper.data(
            { worker_id: result.data.worker_id, skill_id: result.data.skill_id },
            "Success insert worker skill",
            201
        );
    }

    // DELETE one worker skill
    async deleteOne(payload) {
        const { worker_id, skill_id } = payload;

        const existing = await this.query.findOne({ worker_id, skill_id }, { worker_id: 1, skill_id: 1 });
        if (existing.err) {
            return wrapper.error(new NotFoundError("Worker skill not found"));
        }

        const result = await this.command.deleteOne({ worker_id, skill_id });
        if (!result.data) {
            return wrapper.error(new InternalServerError("Failed to delete worker skill"));
        }

        return wrapper.data("Successfully deleted", "Success delete worker skill", 200);
    }
}

module.exports = WorkerSkills;
