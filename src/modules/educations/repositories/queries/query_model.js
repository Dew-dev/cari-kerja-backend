const joi = require("joi");

// GET ALL: /api/v1/workers/educations
const getAllEducationsParam = joi.object({
  worker_id: joi.string().uuid().required(),
});

// GET ONE: /api/v1/workers/educations/:id
const getOneEducationParam = joi.object({
  worker_id: joi.string().uuid().required(),
  id: joi.string().uuid().required(),
});

module.exports = {
  getAllEducationsParam,
  getOneEducationParam
};

