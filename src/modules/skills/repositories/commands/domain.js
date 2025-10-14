const Query = require("../queries/query");
const Command = require("./command");
const { v4: uuidv4 } = require("uuid");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, InternalServerError, BadRequestError } = require("../../../../helpers/errors");
const ctx = "Certification-Command-Domain";

class Skill {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async addSkill(payload) {
    const newPayload = {
      id: uuidv4(),
      ...payload,
    };

    const result = await this.command.insertOne(newPayload);
    if (result.err) {
      return wrapper.error(new InternalServerError("Failed insert skill"));
    }

    return wrapper.data({ id: result.data.id });
  }

  async updateSkill(payload) {
    const { id } = payload;

    const skill = await this.query.findOne({ id }, { id: 1 });
    if (skill.err) {
      return wrapper.error(new NotFoundError("Skill not found"));
    }

    const result = await this.command.updateOneNew({ id }, { skills_name: payload.skills_name });
    if (result.err) {
      return wrapper.error(new InternalServerError("Update skill failed"));
    }

    return wrapper.data({ id });
  }

  async deleteSkill(payload) {
    const { id } = payload;

    const skill = await this.query.findOne({ id }, { id: 1 });
    if (skill.err) {
      return wrapper.error(new NotFoundError("Skill not found"));
    }

    const result = await this.command.deleteOne({ id });
    if (result.err) {
      return wrapper.error(new InternalServerError("Delete skill failed"));
    }

    return wrapper.data("Success deleted skill");
  }
}

module.exports = Skill;
