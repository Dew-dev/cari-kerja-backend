const joi = require("joi");

// GET ALL: /api/v1/workers/work-exp
const getAllWorkExpParam = joi.object({
  worker_id: joi.string().uuid().required(),
});

// GET ONE: /api/v1/workers/work-exp/:id
const getOneWorkExpParam = joi.object({
  worker_id: joi.string().uuid().required(),
  id: joi.string().uuid().required(),
});

module.exports = {
  getAllWorkExpParam,
  getOneWorkExpParam
};
