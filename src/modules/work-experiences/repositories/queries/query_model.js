const joi = require("joi");

// GET ALL: /api/v1/workers/work-exp
const getAllWorkExpParam = joi.object({
  worker_id: joi.string().uuid().required(),
  locale: joi.string().trim().max(16).optional(),
});

// GET ONE: /api/v1/workers/work-exp/:id
const getOneWorkExpParam = joi.object({
  worker_id: joi.string().uuid().required(),
  id: joi.string().uuid().required(),
  locale: joi.string().trim().max(16).optional(),
});

module.exports = {
  getAllWorkExpParam,
  getOneWorkExpParam
};
