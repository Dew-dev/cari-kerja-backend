const joi = require("joi");

// GET ALL: /api/v1/workers/skills
const getAllWorkerSkillsParam = joi.object({
  worker_id: joi.string().uuid().required(),
});


module.exports = {
  getAllWorkerSkillsParam
};
