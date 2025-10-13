const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, InternalServerError, BadRequestError } = require("../../../../helpers/errors");
const ctx = "Educations-Domain";

class Educations {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

    // INSERT one education
    async insertOne(payload) {
        const document = {
            worker_id: payload.worker_id,
            institution_name: payload.institution_name,
            degree: payload.degree,
            major: payload.major || null,
            start_date: payload.start_date,
            end_date: payload.end_date || null,
            is_current: payload.is_current || false,
            description: payload.description || null,
        };

        const result = await this.command.insertOne(document);
        if (!result.data) {
            return wrapper.error(new InternalServerError("Failed to insert education"));
        }

        return wrapper.data({ id: result.data.id }, "Success insert education", 201);
    }

    // UPDATE one education
    async updateOne(payload) {
        const { id, worker_id } = payload;

        const existing = await this.query.findOne({ id }, { id: 1 });
        if (!existing.data) {
            return wrapper.error(new NotFoundError("Education not found"));
        }

        const document = {
            institution_name: payload.institution_name,
            degree: payload.degree,
            major: payload.major || null,
            start_date: payload.start_date,
            end_date: payload.end_date || null,
            is_current: payload.is_current || false,
            description: payload.description || null,
        };

        const result = await this.command.updateOneNew({ id, worker_id }, document);
        if (!result.data) {
            return wrapper.error(new InternalServerError("Failed to update education"));
        }

        return wrapper.data({ id }, "Success update education", 200);
    }

    // DELETE one education
    async deleteOne(payload) {
        const { id, worker_id } = payload;

        const existing = await this.query.findOne({ id, worker_id }, { id: 1 });
        if (!existing.data) {
            return wrapper.error(new NotFoundError("Education not found"));
        }

        const result = await this.command.deleteOne({ id, worker_id });
        if (!result.data) {
            return wrapper.error(new InternalServerError("Failed to delete education"));
        }

        return wrapper.data("Successfully deleted", "Success delete education", 200);
    } 
}

module.exports = Educations;
