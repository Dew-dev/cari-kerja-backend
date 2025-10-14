const joi = require("joi");

const addSkillType = joi.object({
  skill_name: joi.string().required(),
});

const updateSkillType = joi.object({
  id: joi.string().required(),
  skill_name: joi.string().required(),
});

const deleteSkillType = joi.object({
  id: joi.string().required(),
});

module.exports = {
  addSkillType,
  updateSkillType,
  deleteSkillType,
};
