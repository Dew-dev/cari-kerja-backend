const joi = require("joi");

const STAGE_TYPES = ["applied", "screening", "interview", "offer", "hired", "rejected", "custom"];

const createStageParamType = joi.object({
  job_post_id: joi.string().uuid().required(),
  recruiter_id: joi.string().uuid().required(),
  name: joi.string().trim().min(1).max(50).required(),
  stage_type: joi.string().valid(...STAGE_TYPES).default("custom"),
  position: joi.number().integer().min(0).optional(),
});

const updateStageParamType = joi.object({
  job_post_id: joi.string().uuid().required(),
  recruiter_id: joi.string().uuid().required(),
  stage_id: joi.number().integer().required(),
  name: joi.string().trim().min(1).max(50).optional(),
  color: joi.string().trim().max(20).allow(null).optional(),
  position: joi.number().integer().min(0).optional(),
});

const reorderStagesParamType = joi.object({
  job_post_id: joi.string().uuid().required(),
  recruiter_id: joi.string().uuid().required(),
  stages: joi
    .array()
    .items(
      joi.object({
        id: joi.number().integer().required(),
        position: joi.number().integer().min(0).required(),
      }),
    )
    .min(1)
    .required(),
});

const deleteStageParamType = joi.object({
  job_post_id: joi.string().uuid().required(),
  recruiter_id: joi.string().uuid().required(),
  stage_id: joi.number().integer().required(),
});

module.exports = {
  STAGE_TYPES,
  createStageParamType,
  updateStageParamType,
  reorderStagesParamType,
  deleteStageParamType,
};
