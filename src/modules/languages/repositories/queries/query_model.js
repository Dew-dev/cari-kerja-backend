const joi = require("joi");

// GET ALL: /api/v1/workers/:worker_id/languages
const getAllLanguagesParam = joi.object({
  worker_id: joi.string().uuid().required(),
});

module.exports = {
  getAllLanguagesParam
};
