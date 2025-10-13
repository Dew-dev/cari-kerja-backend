const joi = require("joi");

// GET ALL: /api/v1/workers/portofolios
const getAllPortofoliosParam = joi.object({
  worker_id: joi.string().uuid().required(),
});


module.exports = {
  getAllPortofoliosParam
};
