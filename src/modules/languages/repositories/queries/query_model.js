const joi = require("joi");

// GET ALL: /api/v1/workers/:worker_id/languages
const getAllLanguagesParam = joi.object({
  worker_id: joi.string().uuid().required(),
});

// GET ALL master languages: /api/v1/languages?search=
const getAllMasterLanguagesParam = joi.object({
  search: joi.string().allow("").optional().empty(""),
});

module.exports = {
  getAllLanguagesParam,
  getAllMasterLanguagesParam
};
