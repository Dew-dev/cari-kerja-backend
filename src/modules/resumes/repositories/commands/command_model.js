const joi = require("joi");

const addResumeType = joi.object({
  worker_id: joi.string().required(),
  resume_url: joi.string().required(),
  title: joi.string().required(),
  is_default: joi.boolean().required(),
});

const updateResumeType = joi.object({
  id: joi.string().required(),
  worker_id: joi.string().required(),
  resume_url: joi.string().optional(),
  title: joi.string().optional(),
  is_default: joi.boolean().optional(),
});

const deleteResumeType = joi.object({
  id: joi.string().required(),
});

module.exports = {
  addResumeType,
  updateResumeType,
  deleteResumeType,
};
