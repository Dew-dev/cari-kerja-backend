const joi = require("joi");

const addCertification = joi.object({
  worker_id: joi.string().required(),
  name: joi.string().required(),
  issuer: joi.string().required(),
  issue_date: joi.string().required(),
  expiry_date: joi.string().required(),
  credential_id: joi.string().required(),
  is_active: joi.boolean().required(),
});

const updateCertification = joi.object({
  id: joi.string().required(),
  worker_id: joi.string().required(),
  name: joi.string().optional(),
  issuer: joi.string().optional(),
  issue_date: joi.string().optional(),
  expiry_date: joi.string().optional(),
  credential_id: joi.string().optional(),
  is_active: joi.boolean().optional(),
});

const deleteCertification = joi.object({
  id: joi.string().required(),
});

module.exports = {
  addCertification,
  updateCertification,
  deleteCertification,
};
