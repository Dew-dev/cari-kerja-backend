const joi = require("joi");

const jobPostQuestionCreateParamType = joi.object({
  question_text: joi.string().required(),
  question_type_id: joi.number().integer().required(),
  options: joi.object().allow(null).default(null),
  is_required: joi.boolean().default(true),
  order_index: joi.number().integer().min(0).default(0),
  created_at: joi.date().default(() => new Date().toISOString()), // sama dengan now()
  updated_at: joi.date().default(() => new Date().toISOString()), // sama dengan now()
});

const createJobPostParamType = joi.object({
  recruiter_id: joi.string().required(),
  title: joi.string().required(),
  description: joi.string().required(),
  employment_type_id: joi.number().required(),
  experience_level_id: joi.number().required(),
  salary_type_id: joi.number().required(),
  job_post_status_id: joi.number().required(),
  location: joi.string().optional(),
  province: joi.string().when('city', {
    is: joi.exist(),
    then: joi.string().required().messages({
      'any.required': 'province is required when city is provided'
    }),
    otherwise: joi.string().optional()
  }),
  city: joi.string().optional(),
  salary_min: joi.number().required(),salary_max: joi
      .number()
      .optional()
      .custom((value, helpers) => {
        const { salary_min } = helpers.state.ancestors[0];
        if (value < salary_min) {
          return helpers.error("any.invalid");
        }
        return value;
      })
      .messages({
        "any.invalid": "salary_max must be greater than salary_min",
      }),
  currency_id: joi.number().required(),
  status_id: joi.number().default(3),
  is_vip: joi.boolean().optional().default(false),
  vip_start_at: joi.date().optional().allow(null),
  vip_end_at: joi.date().optional().allow(null),
  is_remote: joi.boolean().optional().default(false),
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
  skills: joi
    .array()
    .items(
      joi.alternatives().try(
        joi.string().uuid(),
        joi.object({
          id: joi.string().uuid().optional(),
          name: joi.string().optional(),
          skill_id: joi.string().uuid().required(),
          skill_name: joi.string().optional(),
        }),
      ),
    )
    .optional(),
  country: joi.string().optional(),
  category_id: joi.number().required(),
  requirements: joi
    .array()
    .items(
      joi.object({
        requirement: joi.string().required(),
        order_index: joi.number().required(),
      }),
    )
    .optional(),
  benefits: joi
    .array()
    .items(
      joi.object({
        benefit: joi.string().required(),
        order_index: joi.number().required(),
      }),
    )
    .optional(),
  responsibilities: joi
    .array()
    .items(
      joi.object({
        responsibility: joi.string().required(),
        order_index: joi.number().required(),
      }),
    )
    .optional(),
  job_post_questions: joi.array().items(jobPostQuestionCreateParamType).optional(),
  questions: joi.array().items(jobPostQuestionCreateParamType).optional(),
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
  answers: joi
    .array()
    .items(
      joi.object({
        question_id: joi.string().uuid().required(),
        answer: joi.string().allow(null, "").optional(),
      })
    )
    .optional(), // boleh kosong, misal ga ada pertanyaan
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

const duplicateJobPostParamType = joi.object({
  id: joi.string().uuid().required(),
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
  salary_max: joi
      .number()
      .optional()
      .custom((value, helpers) => {
        const { salary_min } = helpers.state.ancestors[0];
        if (value < salary_min) {
          return helpers.error("any.invalid");
        }
        return value;
      })
      .messages({
        "any.invalid": "salary_max must be greater than salary_min",
      }),
  currency_id: joi.number().required(),
  location: joi.string().optional(),
  province: joi.string().when('city', {
    is: joi.exist(),
    then: joi.string().required().messages({
      'any.required': 'province is required when city is provided'
    }),
    otherwise: joi.string().optional()
  }),
  city: joi.string().optional(),
  is_vip: joi.boolean().optional(),
  vip_start_at: joi.date().optional().allow(null),
  vip_end_at: joi.date().optional().allow(null),
  is_remote: joi.boolean().optional(),
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
  skills: joi
    .array()
    .items(
      joi.alternatives().try(
        joi.string().uuid(),
        joi.object({
          id: joi.string().uuid().optional(),
          name: joi.string().optional(),
          skill_id: joi.string().uuid().required(),
          skill_name: joi.string().optional(),
        }),
      ),
    )
    .optional(),
  job_post_questions: joi
    .array()
    .items(jobPostQuestionCreateParamType)
    .optional(),
  questions: joi.array().items(jobPostQuestionCreateParamType).optional(),
});
const archiveJobPostParamType = joi.object({
  id: joi.string().uuid().required(),
  recruiter_id: joi.string().uuid().required(),
});

const updateJobPostVipParamType = joi.object({
  id: joi.string().uuid().required(),
  recruiter_id: joi.string().uuid().required(),
  is_vip: joi.boolean().required(),
  vip_start_at: joi.date().optional().allow(null),
  vip_end_at: joi.date().optional().allow(null),
});

const deleteJobPostParamType = joi.object({
  id: joi.string().uuid().required(),
  recruiter_id: joi.string().uuid().required(),
});

module.exports = {
  createJobPostParamType,
  jobPostQuestionCreateParamType,
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
  updateJobPostVipParamType,
  duplicateJobPostParamType,
  archiveJobPostParamType,
  deleteJobPostParamType,
};
