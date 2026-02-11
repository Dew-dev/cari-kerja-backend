const joi = require("joi");

const getResumeType = joi.object({
  // id: joi.string().required(),
  worker_id: joi.string().required(),
});

const getAllResumesType = joi.object({
  worker_id: joi.string().required(),
  page: joi.number().default(1).optional(),
  limit: joi.number().default(10).optional(),
});

module.exports = {
  getResumeType,
  getAllResumesType,
};
