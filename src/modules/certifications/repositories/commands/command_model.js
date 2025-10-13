const joi = require("joi");

const addCertification = joi.object({
  worker_id: joi.string().required(),
  name: joi.string().required(),
  issuer: joi.string().required(),
  issue_date: joi.date().required(),
  expiry_date: joi.date().required(),
  credential_id: joi.boolean().required(),
  is_active: joi.string().required(),
});

const updateCertification = joi.object({
  id: joi.string().required(),
  worker_id: joi.string().required(),
  name: joi.string().optional(),
  issuer: joi.string().optional(),
  issue_date: joi.date().optional(),
  expiry_date: joi.date().optional(),
  credential_id: joi.boolean().optional(),
  is_active: joi.string().optional(),
});

const deleteCertification = joi.object({
  id: joi.string().required(),
});

module.exports = {
  addCertification,
  updateCertification,
  deleteCertification,
};
