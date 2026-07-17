const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, InternalServerError } = require("../../../../helpers/errors");
const ctx = "Skills-Query-Domain";

class Skill {
  constructor(db) {
    this.query = new Query(db);
  }

  async getOneSkill(payload) {
    const { id } = payload;
    const skill = await this.query.findOne(
      { id },
      { id: 1, skill_name: 1, created_at: 1 }
    );
    if (skill.err) {
      logger.error(ctx, "getSkill", "Can not find skill", skill.err);
      return wrapper.error(new NotFoundError("Can not find skill"));
    }

    return wrapper.data(skill.data);
  }

  async getAllSkills(payload) {
    const { page, limit, search } = payload;

    const skills = await this.query.findAllSkills(page, limit, search);
    const count = await this.query.countAllSkills(search);

    ////console.log(skills);

    if (skills.err) {
      logger.error(ctx, "getAllSkills", "Can not find skills", skills.err);
      return wrapper.error(new NotFoundError("Can not find skills"));
    }

    if (count.err) {
      logger.error(ctx, "getAllSkills", "Can not count skills", count.err);
      return wrapper.error(new InternalServerError("Can not count skills"));
    }

    const totalData = count.data;
    const limitNum = Number(limit) || 0;
    const totalPages = limitNum > 0 ? Math.ceil(totalData / limitNum) : 0;
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
