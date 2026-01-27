const joi = require("joi");

const createJobPostParamType = joi.object({
  recruiter_id: joi.string().required(),
  title: joi.string().required(),
  description: joi.string().required(),
  employment_type_id: joi.number().required(),
  experience_level_id: joi.number().required(),
  salary_type_id: joi.number().required(),
  job_post_status_id: joi.number().required(),
  location: joi.string().required(),
  salary_min: joi.number().required(),
  salary_max: joi.number().required(),
  currency_id: joi.number().required(),
  status_id: joi.number().default(3),
  deadline: joi.string().optional().allow(""),
  tags: joi
    .array()
    .items(
      joi.object({
        id: joi.string().required(),
        name: joi.string().required(),
      }),
    )
    .optional(),
  country: joi.string().optional(),
  city: joi.string().optional(),
  category_id: joi.number().required(),
});

const jobPostQuestionParamType = joi.object({
  job_post_id: joi.string().uuid().required(),
  question_text: joi.string().required(),
  question_type_id: joi.number().integer().required(),
  options: joi.object().allow(null).default(null),
  is_required: joi.boolean().default(true),
  order_index: joi.number().integer().min(0).default(0),
  created_at: joi.date().default(() => new Date().toISOString()), // sama dengan now()
  updated_at: joi.date().default(() => new Date().toISOString()), // sama dengan now()
});

const jobPostQuestionUpdateParamType = joi.object({
  id: joi.string().uuid().required(),
  job_post_id: joi.string().uuid().optional(), // tidak wajib saat update
  question_text: joi.string().required(),
  question_type_id: joi.number().integer().required(),
  options: joi.object().allow(null).default(null),
  is_required: joi.boolean().default(true),
  order_index: joi.number().integer().min(0).default(0),
  updated_at: joi.date().default(() => new Date().toISOString()), // created_at tidak perlu di-update
});

const jobPostStatusUpdateParamType = joi.object({
  id: joi.string().uuid().required(),
  status_id: joi.number().required(),
});

const createJobPostAnswerParamType = joi.object({
  job_application_id: joi.string().uuid().required(),
  question_id: joi.string().uuid().required(),
  answer: joi.object().required(),
  submitted_at: joi.date().default(() => new Date().toISOString()),
});

const updateJobPostAnswerParamType = joi.object({
  id: joi.string().uuid().required(),
  job_application_id: joi.string().uuid().optional(),
  question_id: joi.string().uuid().optional(),
  answer: joi.object().optional(),
  submitted_at: joi.date().optional(),
});

const createJobApplicationParamType = joi.object({
  job_post_id: joi.string().uuid().required(),
  worker_id: joi.string().uuid().required(),
  resume_id: joi.string().uuid().allow(null),
  cover_letter: joi.string().allow(null, ""),
  application_status_id: joi.number().required(),
  // answers: joi
  //   .array()
  //   .items(
  //     joi.object({
  //       question_id: joi.string().uuid().required(),
  //       answer: joi.object().allow(null, "").optional(),
  //     })
  //   )
  //   .optional(), // boleh kosong, misal ga ada pertanyaan
  applied_at: joi.date().default(() => new Date().toISOString()),
  updated_at: joi.date().default(() => new Date().toISOString()),
});

const updateJobApplicationParamType = joi.object({
  id: joi.string().uuid().required(),
  resume_id: joi.string().uuid().allow(null),
  cover_letter: joi.string().allow(null, ""),
  application_status_id: joi.number().optional(),
  updated_at: joi.date().default(() => new Date().toISOString()),
});

const deleteAppliedJobpostParamType = joi.object({
  job_post_id: joi.string().uuid().required(),
  worker_id: joi.string().uuid().required(),
});

const updateApplicationStatusParamType = joi.object({
  id: joi.string().uuid().required(), // job_application.id
  application_status_id: joi.number().required(),
  recruiter_id: joi.string().uuid().required(),
});

const updateJobPostParamType = joi.object({
  id: joi.string().uuid().required(),

  recruiter_id: joi.string().uuid().required(),

  title: joi.string().required(),
  description: joi.string().required(),

  employment_type_id: joi.number().required(),
  experience_level_id: joi.number().required(),
  salary_type_id: joi.number().required(),

  salary_min: joi.number().required(),
  salary_max: joi.number().required(),
  currency_id: joi.number().required(),

  location: joi.string().required(),
  deadline: joi.string().optional().allow(""),

  tags: joi
    .array()
    .items(
      joi.object({
        id: joi.string().uuid().required(),
        name: joi.string().required(),
      }),
    )
    .optional(),
});

module.exports = {
  createJobPostParamType,
  jobPostQuestionParamType,
  jobPostQuestionUpdateParamType,
  createJobPostAnswerParamType,
  updateJobPostAnswerParamType,
  createJobApplicationParamType,
  updateJobApplicationParamType,
  jobPostStatusUpdateParamType,
  deleteAppliedJobpostParamType,
  updateApplicationStatusParamType,
  updateJobPostParamType,
};
