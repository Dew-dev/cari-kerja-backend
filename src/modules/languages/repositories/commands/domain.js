const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { v4: uuidv4 } = require("uuid");
const { NotFoundError, InternalServerError } = require("../../../../helpers/errors");
const ctx = "Languages-Domain";

class Languages {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  // Resolve id master `languages` dari nama (upsert bila belum ada)
  async resolveLanguageId(languageName) {
    try {
      const result = await this.command.upsertMasterLanguage(languageName);
      return result?.rows?.[0]?.id || null;
    } catch (error) {
      logger.error(ctx, "resolveLanguageId", "Failed to resolve language id", error);
      return null;
    }
  }

  // INSERT one language
  async insertOne(payload) {
    // Pakai language_id dari payload bila dikirim, tanpa upsert; jika tidak, resolve dari nama
    const language_id = payload.language_id || (await this.resolveLanguageId(payload.language_name));
    const document = {
      id: uuidv4(),
      worker_id: payload.worker_id,
      language_name: payload.language_name,
      language_id,
      proficiency_level_id: payload.proficiency_level_id,
      is_primary: payload.is_primary || false,
    };

    const result = await this.command.insertOne(document);
    if (result.err) {
      return wrapper.error(new InternalServerError("Failed to insert language"));
    }
    return wrapper.data({ id: result.data.id }, "Success insert language", 201);
  }

  // UPDATE one language
  async updateOne(payload) {
    const { id, worker_id } = payload;

    const existing = await this.query.findOne({ id }, { id: 1 });
    if (existing.err) {
      return wrapper.error(new NotFoundError("Language not found"));
    }

    const language_id = payload.language_id || (await this.resolveLanguageId(payload.language_name));
    const document = {
      language_name: payload.language_name,
      language_id,
      proficiency_level_id: payload.proficiency_level_id,
      is_primary: payload.is_primary || false,
    };

    const result = await this.command.updateOneNew({ id, worker_id }, document);
    if (result.err) {
      return wrapper.error(new InternalServerError("Failed to update language"));
    }

    return wrapper.data({ id }, "Success update language", 200);
  }

  // DELETE one language
  async deleteOne(payload) {
    const { id, worker_id } = payload;
    const existing = await this.query.findOne({ id, worker_id }, { id: 1 });
    if (existing.err) {
      return wrapper.error(new NotFoundError("Language not found"));
    }

    const result = await this.command.deleteOne({ id, worker_id });
    if (result.err) {
      return wrapper.error(new InternalServerError("Failed to delete language"));
    }

    return wrapper.data("Successfully deleted", "Success delete language", 200);
  }
}

module.exports = Languages;
