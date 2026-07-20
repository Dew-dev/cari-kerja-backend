const joi = require("joi");

const getJobAlertsParamType = joi.object({
  worker_id: joi.string().uuid().required(),
});

module.exports = {
  getJobAlertsParamType,
};
