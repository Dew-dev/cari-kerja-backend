const joi = require("joi");

const getOneSkillType = joi.object({
  id: joi.string().required(),
});

const getAllSkillType = joi.object({
  page: joi.number().default(1).optional(),
  limit: joi.number().default(10).optional(),
  search: joi.string().allow("").optional().empty(""),
});

module.exports = {
  getOneSkillType,
  getAllSkillType,
};
