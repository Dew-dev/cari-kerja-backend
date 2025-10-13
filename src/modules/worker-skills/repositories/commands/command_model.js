const joi = require("joi");

// Schema untuk menambahkan Worker Skills
const addWorkerSkillsParamType = joi.object({
  worker_id: joi.string().uuid().required(),
  skill_id: joi.string().uuid().required(),
});

// Schema untuk menghapus Worker Skills
const deleteWorkerSkillsParamType = joi.object({
  worker_id: joi.string().uuid().required(),
  skill_id: joi.string().uuid().required(),
});

module.exports = {
  addWorkerSkillsParamType,
  deleteWorkerSkillsParamType
};
