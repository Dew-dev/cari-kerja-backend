const joi = require("joi");

const addSkillType = joi.object({
  skills_name: joi.string().required(),
});

const updateSkillType = joi.object({
  id: joi.string().required(),
  skills_name: joi.string().required(),
});

const deleteSkillType = joi.object({
  id: joi.string().required(),
});

module.exports = {
  addSkillType,
  updateSkillType,
  deleteSkillType,
};
