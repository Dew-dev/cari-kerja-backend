const joi = require("joi");

/** Query-string friendly number: treat "" / null as absent. */
const optionalNumber = () =>
  joi
    .alternatives()
    .try(joi.valid("", null), joi.number())
    .optional()
    .custom((value) => (value === "" || value === null ? undefined : value));

const optionalPositiveInt = () =>
  joi
    .alternatives()
    .try(joi.valid("", null), joi.number().integer().positive())
    .optional()
    .custom((value) => (value === "" || value === null ? undefined : value));

const optionalNonNegNumber = () =>
  joi
    .alternatives()
    .try(joi.valid("", null), joi.number().min(0))
    .optional()
    .custom((value) => (value === "" || value === null ? undefined : value));

const getWorkerByUserIdParamType = joi.object({
  user_id: joi.string().required(),
});

const getWorkerByIdParamType = joi.object({
  id: joi.string().uuid().required(),
});

const getWorkersParamType = joi
  .object({
    search: joi.string().allow("").optional(),
    skills: joi
      .alternatives()
      .try(joi.string().allow(""), joi.array().items(joi.string()))
      .optional(),
    gender: joi.string().allow("").optional(),
    nationality: joi.string().allow("").optional(),
    min_salary: optionalNumber(),
    max_salary: optionalNumber(),
    experience_years: optionalNumber(),
    education_level: joi.string().allow("").optional(),
    category_id: optionalPositiveInt(),
    min_years: optionalNonNegNumber(),
    sort_by: joi.string().optional(),
    sort_order: joi.string().optional(),
    page: optionalPositiveInt(),
    limit: optionalPositiveInt(),
  })
  // min_years only makes sense with a category; category alone defaults min_years to 0 in domain.
  .with("min_years", "category_id");

module.exports = {
  getWorkerByUserIdParamType,
  getWorkerByIdParamType,
  getWorkersParamType,
};
