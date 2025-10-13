const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Skills-Query-Domain";

class Skill {
  constructor(db) {
    this.query = new Query(db);
  }

  async getOneSkill(payload) {
    const { id } = payload;
    const skill = await this.query.findOne({ id }, { id: 1, skills_name: 1, created_at: 1 });
    if (skill.err) {
      logger.error(ctx, "getSkill", "Can not find skill", skill.err);
      return wrapper.error(new NotFoundError("Can not find skill"));
    }

    return wrapper.data(skill.data);
  }

  async getAllSkill(payload) {
    const { page, limit, search } = payload;
    const skills = await this.query.findAllSkills(page, limit, search);
    const count = await this.query.countAllSkills(search);

    if (skills.err) {
      logger.error(ctx, "getAllSkills", "Can not find skills", skills.err);
      return wrapper.error(new NotFoundError("Can not find skills"));
    }

    const totalData = count.data;
    const totalPages = Math.ceil(totalData / limit);
    const meta = {
      page: page,
      per_page: limit,
      total_data: Math.max(totalData, 0),
      total_pages: totalPages,
    };

    return wrapper.paginationData(skills.data, meta);
  }
}

module.exports = Skill;
