const joi = require("joi");

const createSavedJobParamType = joi.object({
  job_post_id: joi.string().required(),
  worker_id: joi.string().required(),
});

const deleteSavedJobParamType = joi.object({
  id: joi.string().required(),
});



module.exports = {
  createSavedJobParamType,
  deleteSavedJobParamType,
};
