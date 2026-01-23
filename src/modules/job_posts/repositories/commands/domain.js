const { v4: uuidv4 } = require("uuid");
const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const {
  NotFoundError,
  ConflictError,
  InternalServerError,
  BadRequestError,
} = require("../../../../helpers/errors");
const ctx = "Jobposts-Command-Domain";
const joi = require("joi");
const commandModel = require("../../repositories/commands/command_model");
const validator = require("../../../../helpers/utils/validator");
const {
  sendResponse,
  paginationResponse,
} = require("../../../../helpers/utils/response");
const jobPostQuestionParamType = require("./command_model.js");
// const commandModel = require("../../job_tags/repositories/commands/command_model");
const tagsModel = require("../../../job_tags/repositories/commands/command_model.js");

class Jobpost {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async createJobPost(payload) {
    const {
      recruiter_id,
      title,
      description,
      employment_type_id,
      experience_level_id,
      salary_type_id,
      location,
      salary_min,
      salary_max,
      currency_id,
      status_id,
      deadline,
      tags,
    } = payload;

    const data = {
      id: uuidv4(),
      recruiter_id,
      title,
      description,
      employment_type_id,
      experience_level_id,
      salary_type_id,
      location,
      salary_min,
      salary_max,
      currency_id,
      status_id,
      deadline,
    };

    const result = await this.command.insertOne(data);
    if (result.err) {
      logger.error(ctx, "Create job post", "Job Posts Commands", result.err);
      return wrapper.error(new InternalServerError("Create Job Post Failed"));
    }

    return wrapper.data(data);
  }

  async createJobPostQuestions(payloadArray, id, ctx) {
    try {
      if (!Array.isArray(payloadArray)) {
        throw new Error("Payload harus berupa array of questions");
      }

      // Validasi & siapkan data
      const validatedData = payloadArray.map((item, idx) => {
        const validateItem = validator.isValidPayload(
          item,
          commandModel.jobPostQuestionParamType
        );

        if (validateItem.err) {
          throw new Error(`Validation error: ${validateItem.err.message}`);
        }
        const value = validateItem.data;

        return {
          id: uuidv4(),
          job_post_id: id,
          question_text: value.question_text,
          question_type_id: value.question_type_id,
          options: value.options || null,
          is_required: value.is_required,
          order_index: value.order_index,
          created_at: value.created_at,
          updated_at: value.updated_at,
        };
      });
      // Lakukan bulk insert
      const result = await this.command.insertMany(
        validatedData,
        "job_post_questions"
      );
      if (result.err) {
        logger.error(
          ctx,
          "Bulk create job post questions",
          "Job Posts Commands",
          result.err
        );
        return wrapper.error(new InternalServerError(result.err));
      }

      return wrapper.data(validatedData);
    } catch (err) {
      logger.error(
        ctx,
        "Bulk create job post questions",
        "Job Posts Commands",
        err
      );
      return wrapper.error(new InternalServerError(err.message));
    }
  }

  async updateJobPostQuestion(payload, id, ctx) {
    try {
      if (!payload || typeof payload !== "object") {
        throw new Error("Payload harus berupa object");
      }
      payload = { ...payload, id: id };
      const validateItem = validator.isValidPayload(
        payload,
        commandModel.jobPostQuestionUpdateParamType
      );

      if (validateItem.err) {
        throw new Error(`Validation error: ${validateItem.err.message}`);
      }

      const value = validateItem.data;

      if (!value.id) {
        throw new Error("Field 'id' wajib ada untuk update");
      }

      const parameter = { id: id };
      const updateQuery = {
        question_text: value.question_text,
        question_type_id: value.question_type_id,
        options: value.options || null,
        is_required: value.is_required,
        order_index: value.order_index,
        updated_at: value.updated_at,
      };

      const result = await this.command.updateOneNew(
        parameter,
        updateQuery,
        "job_post_questions"
      );

      if (result.err) {
        logger.error(
          ctx,
          "Update job post question",
          "Job Posts Commands",
          result.err
        );
        return wrapper.error(new InternalServerError(result.err));
      }

      return wrapper.data(result.data);
    } catch (err) {
      logger.error(ctx, "Update job post question", "Job Posts Commands", err);
      return wrapper.error(new InternalServerError(err.message));
    }
  }

  async updateJobPostQuestion(payload, id, ctx) {
    try {
      if (!payload || typeof payload !== "object") {
        throw new Error("Payload harus berupa object");
      }
      payload = { ...payload, id: id };
      const validateItem = validator.isValidPayload(
        payload,
        commandModel.jobPostQuestionUpdateParamType
      );

      if (validateItem.err) {
        throw new Error(`Validation error: ${validateItem.err.message}`);
      }

      const value = validateItem.data;

      if (!value.id) {
        throw new Error("Field 'id' wajib ada untuk update");
      }

      const parameter = { id: id };
      const updateQuery = {
        question_text: value.question_text,
        question_type_id: value.question_type_id,
        options: value.options || null,
        is_required: value.is_required,
        order_index: value.order_index,
        updated_at: value.updated_at,
      };

      const result = await this.command.updateOneNew(
        parameter,
        updateQuery,
        "job_post_questions"
      );

      if (result.err) {
        logger.error(
          ctx,
          "Update job post question",
          "Job Posts Commands",
          result.err
        );
        return wrapper.error(new InternalServerError(result.err));
      }

      return wrapper.data(result.data);
    } catch (err) {
      logger.error(ctx, "Update job post question", "Job Posts Commands", err);
      return wrapper.error(new InternalServerError(err.message));
    }
  }

  //update job post Status

  async updateJobPostStatus(payload, id, ctx) {
    try {
      if (!payload || typeof payload !== "object") {
        throw new Error("Payload harus berupa object");
      }
      payload = { ...payload, id: id };
      //console.log("payload status: ", payload);
      const validateItem = validator.isValidPayload(
        payload,
        commandModel.jobPostStatusUpdateParamType
      );

      if (validateItem.err) {
        throw new Error(`Validation error: ${validateItem.err.message}`);
      }

      const value = validateItem.data;

      if (!value.id) {
        throw new Error("Field 'id' wajib ada untuk update");
      }

      const parameter = { id: id };
      const updateQuery = {
        status_id: value.status_id,
      };

      const result = await this.command.updateOneNew(
        parameter,
        updateQuery,
        "job_posts"
      );

      if (result.err) {
        logger.error(
          ctx,
          "Update job post status",
          "Job Posts Commands",
          result.err
        );
        return wrapper.error(new InternalServerError(result.err));
      }

      return wrapper.data(result.data);
    } catch (err) {
      logger.error(ctx, "Update job post status", "Job Posts Commands", err);
      return wrapper.error(new InternalServerError(err.message));
    }
  }
  //worker mulai dari sini

  async createJobApplication(payload) {
    // const client = await this.command.db.connect();
    try {
      // await client.query("BEGIN");
      const {
        job_post_id,
        worker_id,
        resume_id,
        cover_letter,
        application_status_id,
        answers, // array of { question_id, answer_text }
      } = payload;

      const ctx = "Job Applications Commands";

      const existing = await this.query.findOne(
        { job_post_id, worker_id }, // parameter
        { id: true }, // projection (kolom apa yang mau diambil)
        "job_applications" // nama tabel
      );
      if (existing.data) {
        return wrapper.error(new Error("Anda sudah melamar pekerjaan ini."));
      }

      const data = {
        id: uuidv4(),
        job_post_id,
        worker_id,
        resume_id,
        cover_letter,
        application_status_id,
        applied_at: new Date(),
        updated_at: new Date(),
      };

      // insert ke job_applications
      const result = await this.command.insertOne(data, "job_applications");
      if (result.err) {
        logger.error(ctx, "Create Job Application", ctx, result.err);
        return wrapper.error(
          new InternalServerError("Create Job Application Failed")
        );
      }

      // insert ke job_post_answers (jika ada)
      if (Array.isArray(answers) && answers.length > 0) {
        const answerPayload = answers.map((a) => ({
          id: uuidv4(),
          job_application_id: data.id,
          question_id: a.question_id,
          answer: a.answer,
          submitted_at: a.submitted_at || new Date(),
        }));

        const resultAnswer = await this.command.insertMany(
          answerPayload,
          "job_post_answers"
        );
        if (resultAnswer.err) {
          logger.error(ctx, "Insert Job Post Answers", ctx, resultAnswer.err);
          return wrapper.error(
            new InternalServerError("Create Job Post Answers Failed")
          );
        }
      }

      // await client.query("COMMIT");

      return wrapper.data({
        job_application: data,
        answers: answers || [],
      });
    } catch (err) {
      // await client.query("ROLLBACK");
      logger.error(
        "Job Applications Commands",
        "Create Job Application",
        ctx,
        err
      );

      return wrapper.error(new InternalServerError(err.message));
    }
  }

  async createJobPostAnswers(payloadArray, jobApplicationId, ctx) {
    try {
      if (!Array.isArray(payloadArray)) {
        throw new Error("Payload harus berupa array of answers");
      }

      // Validasi & siapkan data
      const validatedData = payloadArray.map((item, idx) => {
        item = { ...item, job_application_id: jobApplicationId };
        const validateItem = validator.isValidPayload(
          item,
          commandModel.createJobPostAnswerParamType
        );

        if (validateItem.err) {
          throw new Error(`Validation error: ${validateItem.err.message}`);
        }
        const value = validateItem.data;

        return {
          id: uuidv4(),
          job_application_id: jobApplicationId,
          question_id: value.question_id,
          answer: value.answer,
          submitted_at: value.submitted_at || new Date(),
        };
      });

      // Lakukan bulk insert
      const result = await this.command.insertMany(
        validatedData,
        "job_post_answers"
      );
      if (result.err) {
        logger.error(
          ctx,
          "Bulk create job post answers",
          "Job Post Answers Commands",
          result.err
        );
        return wrapper.error(new InternalServerError(result.err));
      }

      return wrapper.data(validatedData);
    } catch (err) {
      logger.error(
        ctx,
        "Bulk create job post answers",
        "Job Post Answers Commands",
        err
      );
      return wrapper.error(new InternalServerError(err.message));
    }
  }

  async deleteAppliedJobpost({ job_post_id, worker_id }) {
    const result = await this.command.deleteAppliedJobpost({
      job_post_id,
      worker_id,
    });

    if (result.rowCount === 0) {
      return wrapper.error("Application not found or already withdrawn");
    }

    return wrapper.data("Application withdrawn successfully");
  }
}   

module.exports = Jobpost;
