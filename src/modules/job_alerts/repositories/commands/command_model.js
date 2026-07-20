const joi = require("joi");

const updateJobAlertsParamType = joi.object({
  worker_id: joi.string().uuid().required(),
  enabled: joi.boolean().required(),
});

module.exports = {
  updateJobAlertsParamType,
};
