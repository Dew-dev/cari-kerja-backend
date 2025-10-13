const joi = require("joi");

const getOneCertificationParamType = joi.object({
  worker_id: joi.string().required(),
  id: joi.string().required(),
});

const getAllCertificationParamType = joi.object({
  worker_id: joi.string().required(),
  page: joi.number().default(1).optional(),
  limit: joi.number().default(10).optional(),
});

module.exports = {
  getOneCertificationParamType,
  getAllCertificationParamType,
};
