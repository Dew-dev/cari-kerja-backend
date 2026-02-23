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
const { sendMail } = require("../../../../helpers/utils/mailer");
const   statusEmailTemplate = require("../../../../helpers/utils/statusEmailTemplate");

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
      category_id,
      requirements,
      benefits,
      responsibilities,
      job_post_questions,
      questions,
      skills,
      province,
      city,
      is_vip,
      vip_start_at,
      vip_end_at,
    } = payload;

    const jobPostId = uuidv4();
    const data = {
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
      category_id,
      province,
      city,
      is_vip: is_vip ?? false,
      vip_start_at: is_vip ? (vip_start_at ?? new Date()) : null,
      vip_end_at: is_vip ? (vip_end_at ?? null) : null,
    };

    const result = await this.command.insertJobPost(data);
    if (!result || result.err) {
      logger.error(ctx, "Create job post", "Job Posts Commands", result?.err);
      return wrapper.error(new InternalServerError("Create Job Post Failed"));
    }

    const actualJobPostId = result.id || jobPostId;

    // Insert requirements if provided
    if (requirements && Array.isArray(requirements) && requirements.length > 0) {
      const requirementsData = requirements.map((req) => ({
        id: uuidv4(),
        job_post_id: actualJobPostId,
        requirement: req.requirement,
        order_index: req.order_index,
      }));
      
      const reqResult = await this.command.insertMany(requirementsData, "job_post_requirements");
      if (reqResult.err) {
        logger.error(ctx, "Create job post requirements", "Job Posts Commands", reqResult.err);
      }
    }

    // Insert benefits if provided
    if (benefits && Array.isArray(benefits) && benefits.length > 0) {
      const benefitsData = benefits.map((ben) => ({
        id: uuidv4(),
        job_post_id: actualJobPostId,
        benefit: ben.benefit,
        order_index: ben.order_index,
      }));
      
      const benResult = await this.command.insertMany(benefitsData, "job_post_benefits");
      if (benResult.err) {
        logger.error(ctx, "Create job post benefits", "Job Posts Commands", benResult.err);
      }
    }

    // Insert responsibilities if provided
    if (responsibilities && Array.isArray(responsibilities) && responsibilities.length > 0) {
      const responsibilitiesData = responsibilities.map((resp) => ({
        id: uuidv4(),
        job_post_id: actualJobPostId,
        responsibility: resp.responsibility,
        order_index: resp.order_index,
      }));
      
      const respResult = await this.command.insertMany(responsibilitiesData, "job_post_responsibilities");
      if (respResult.err) {
        logger.error(ctx, "Create job post responsibilities", "Job Posts Commands", respResult.err);
      }
    }

    // Insert skills if provided
    if (skills && Array.isArray(skills) && skills.length > 0) {
      const skillsData = skills.map((skill) => ({
        id: uuidv4(),
        job_post_id: actualJobPostId,
        // Handle both UUID string and object format
        skill_id: typeof skill === 'string' ? skill : skill.skill_id,
        created_at: new Date(),
      }));
      
      const skillResult = await this.command.insertMany(skillsData, "job_post_skills");
      //console.log("skillResult:", skillResult);
      if (skillResult.err) {
        logger.error(ctx, "Create job post skills", "Job Posts Commands", skillResult.err);
      }
    }

    const questionPayload = Array.isArray(job_post_questions)
      ? job_post_questions
      : Array.isArray(questions)
        ? questions
        : null;
    //console.log("questionPayload:", questionPayload);
    if (questionPayload && questionPayload.length > 0) {
      const questionResult = await this.createJobPostQuestions(
        questionPayload,
        actualJobPostId,
        ctx,
      );
      if (questionResult.err) {
        logger.error(
          ctx,
          "Create job post questions",
          "Job Posts Commands",
          questionResult.err,
        );
      }
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
          { ...item, job_post_id: id },
          commandModel.jobPostQuestionParamType,
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
        "job_post_questions",
      );
      if (result.err) {
        logger.error(
          ctx,
          "Bulk create job post questions",
          "Job Posts Commands",
          result.err,
        );
        return wrapper.error(new InternalServerError(result.err));
      }

      return wrapper.data(validatedData);
    } catch (err) {
      logger.error(
        ctx,
        "Bulk create job post questions",
        "Job Posts Commands",
        err,
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
        commandModel.jobPostQuestionUpdateParamType,
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
        "job_post_questions",
      );

      if (result.err) {
        logger.error(
          ctx,
          "Update job post question",
          "Job Posts Commands",
          result.err,
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
        commandModel.jobPostQuestionUpdateParamType,
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
        "job_post_questions",
      );

      if (result.err) {
        logger.error(
          ctx,
          "Update job post question",
          "Job Posts Commands",
          result.err,
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
      ////console.log("payload status: ", payload);
      const validateItem = validator.isValidPayload(
        payload,
        commandModel.jobPostStatusUpdateParamType,
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
        "job_posts",
      );

      if (result.err) {
        logger.error(
          ctx,
          "Update job post status",
          "Job Posts Commands",
          result.err,
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
        "job_applications", // nama tabel
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
          new InternalServerError("Create Job Application Failed"),
        );
      }

      // Fetch job post questions if no answers provided
      let answerPayload = [];
      if (Array.isArray(answers) && answers.length > 0) {
        // Use provided answers - convert string answers to JSON objects
        answerPayload = answers.map((a) => {
          let answerValue = a.answer;
          // If answer is a string, wrap it in an object with "text" field
          if (typeof answerValue === 'string') {
            answerValue = { text: answerValue };
          }
          return {
            id: uuidv4(),
            job_application_id: data.id,
            question_id: a.question_id,
            answer: answerValue,
            submitted_at: a.submitted_at || new Date(),
          };
        });
      } else {
        // Auto-create empty answers for all job post questions
        const questionsResult = await this.query.findAllByJobPostId({
          job_post_id,
          conditions: "",
          orderColumn: "q.order_index",
          orderDirection: "ASC",
          idx: 2,
          values: [job_post_id],
          limit: 1000,
          page: 1,
        });

        if (!questionsResult.err && questionsResult.data && questionsResult.data.length > 0) {
          answerPayload = questionsResult.data.map((q) => ({
            id: uuidv4(),
            job_application_id: data.id,
            question_id: q.id,
            answer: null,
            submitted_at: new Date(),
          }));
        }
      }

      // insert ke job_post_answers (jika ada)
      if (answerPayload.length > 0) {
        const resultAnswer = await this.command.insertMany(
          answerPayload,
          "job_post_answers",
        );
        if (resultAnswer.err) {
          logger.error(ctx, "Insert Job Post Answers", ctx, resultAnswer.err);
          return wrapper.error(
            new InternalServerError("Create Job Post Answers Failed"),
          );
        }
      }

      // await client.query("COMMIT");

      return wrapper.data({
        job_application: data,
        answers: answerPayload || [],
      });
    } catch (err) {
      // await client.query("ROLLBACK");
      logger.error(
        "Job Applications Commands",
        "Create Job Application",
        ctx,
        err,
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
          commandModel.createJobPostAnswerParamType,
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
        "job_post_answers",
      );
      if (result.err) {
        logger.error(
          ctx,
          "Bulk create job post answers",
          "Job Post Answers Commands",
          result.err,
        );
        return wrapper.error(new InternalServerError(result.err));
      }

      return wrapper.data(validatedData);
    } catch (err) {
      logger.error(
        ctx,
        "Bulk create job post answers",
        "Job Post Answers Commands",
        err,
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

  async updateApplicationStatus(payload) {
    const { id, application_status_id, recruiter_id } = payload;

    // 1. Ambil application + job_post
    const application = await this.query.findOneJobApplication({
      id,
    });

    if (application.err || !application.data) {
      return wrapper.error(new NotFoundError("Application not found"));
    }

    // 2. Pastikan recruiter pemilik job
    if (application.data.recruiter_id !== recruiter_id) {
      return wrapper.error(
        new ForbiddenError("You are not allowed to update this application"),
      );
    }

    // 3. Update status
    const result = await this.command.updateJobApplicationStatus({
      id,
      application_status_id,
    });

    if (result.err) {
      logger.error(
        ctx,
        "updateApplicationStatus",
        "Failed to update application status",
        result.err,
      );
      return wrapper.error(
        new InternalServerError("Failed to update application status"),
      );
    }

    const app = await this.query.findApplicationWithUser(id);
    if (app.err || !app.data) {
      return wrapper.error(new NotFoundError("Application not found"));
    }

    // kirim email (NON-BLOCKING OPTIONAL)
    try {
      await sendMail({
        to: app.data.email,
        subject: `Application status updated — ${app.data.job_title}`,
        html: statusEmailTemplate({
          name: app.data.user_name,
          jobTitle: app.data.job_title,
          status: app.data.status_name,
        }),
      });
    } catch (e) {
      logger.error(ctx, "changeApplicationStatus", "Send email failed", e);
      return wrapper.error(
        new InternalServerError(e.message),
      );
    }

    return wrapper.data("Application status updated successfully");
  }

  async updateJobPost(payload) {
    
    console.log("skillResult (update):", payload);
    const { id, recruiter_id, user_id, tags, job_post_questions, questions, skills, province, city, is_vip, vip_start_at, vip_end_at, ...jobData } = payload;

    // 1️⃣ cek job milik recruiter
    const job = await this.query.findOneJobPost({
      id,
      recruiter_id,
    });

    if (job.err || !job.data) {
      return wrapper.error(
        new NotFoundError("Job not found or not owned by recruiter"),
      );
    }

    // 2️⃣ update job_posts - preserve existing values for fields not provided
    const updateResult = await this.command.updateJobPost({
      id,
      ...jobData,
      location: jobData.location ?? job.data.location,
      province: province ?? job.data.province,
      city: city ?? job.data.city,
      is_vip: is_vip ?? job.data.is_vip,
      vip_start_at: is_vip === undefined ? job.data.vip_start_at : (is_vip ? (vip_start_at ?? new Date()) : null),
      vip_end_at: is_vip === undefined ? job.data.vip_end_at : (is_vip ? (vip_end_at ?? null) : null),
    });

    if (!updateResult) {
      logger.error(ctx, "updateJobPost", "Update job failed", updateResult);
      return wrapper.error(new InternalServerError("Failed to update job"));
    }

    // 3️⃣ update tags (replace)
    if (tags) {
      // hapus existing
      await this.command.deleteJobPostTags({ job_post_id: id });

      // insert ulang
      for (const tag of tags) {
        await this.command.insertJobPostTag({
          job_post_id: id,
          tag_id: tag.id,
        });
      }
    }

    // 3.5️⃣ update skills (replace)
    if (skills !== undefined) {
      // hapus existing skills
      await this.command.deleteMany({ job_post_id: id }, "job_post_skills");

      // insert ulang jika ada skills baru
      if (Array.isArray(skills) && skills.length > 0) {
        const skillsData = skills.map((skill) => ({
          id: uuidv4(),
          job_post_id: id,
          // Handle both UUID string and object format
          skill_id: typeof skill === 'string' ? skill : skill.skill_id,
          created_at: new Date(),
        }));
        
        const skillResult = await this.command.insertMany(skillsData, "job_post_skills");
        // console.log("skillResult (update):", skillResult);
        if (skillResult.err) {
          logger.error(ctx, "Update job post skills", "Job Posts Commands", skillResult.err);
        }
      }
    }

    // 4️⃣ update questions (replace)
    const questionPayload = Array.isArray(job_post_questions)
      ? job_post_questions
      : Array.isArray(questions)
        ? questions
        : null;
    //console.log("questionPayload (update):", questionPayload);
    if (questionPayload) {
      // delete existing questions
      await this.command.deleteJobPostQuestions({ job_post_id: id });

      // insert new questions if any provided
      if (questionPayload.length > 0) {
        const questionResult = await this.createJobPostQuestions(
          questionPayload,
          id,
          ctx,
        );
        if (questionResult.err) {
          logger.error(
            ctx,
            "Update job post questions",
            "Job Posts Commands",
            questionResult.err,
          );
        }
      }
    }

    return wrapper.data(payload);
  }

  async updateJobPostVip(payload) {
    const { id, recruiter_id, is_vip, vip_start_at, vip_end_at } = payload;

    const job = await this.query.findOneJobPost({ id, recruiter_id });

    if (job.err || !job.data) {
      return wrapper.error(
        new NotFoundError("Job not found or not owned by recruiter"),
      );
    }

    const updateData = {
      is_vip,
      vip_start_at: is_vip ? (vip_start_at ?? new Date()) : null,
      vip_end_at: is_vip ? (vip_end_at ?? null) : null,
    };

    const result = await this.command.updateOneNew({ id }, updateData, "job_posts");

    if (result.err) {
      logger.error(ctx, "updateJobPostVip", "Update VIP job failed", result.err);
      return wrapper.error(new InternalServerError("Failed to update job VIP status"));
    }

    return wrapper.data({ id, ...updateData });
  }

  async duplicateJobPost(payload) {
    const { id, recruiter_id } = payload;

    // 1️⃣ ambil job asli dengan semua relasi
    const job = await this.query.findJobWithTags({
      id,
      recruiter_id,
    });

    if (job.err || !job.data) {
      return wrapper.error(
        new NotFoundError("Job not found or not owned by recruiter"),
      );
    }

    const original = job.data;

    // 2️⃣ create job baru (DRAFT)
    const newJob = await this.command.insertJobPost({
      recruiter_id,
      title: `${original.title} (Copy)`,
      description: original.description,
      employment_type_id: original.employment_type_id,
      experience_level_id: original.experience_level_id,
      salary_type_id: original.salary_type_id,
      salary_min: original.salary_min,
      salary_max: original.salary_max,
      currency_id: original.currency_id,
      location: original.location,
      deadline: original.deadline,
      status_id: 3, // DRAFT
      category_id: original.category_id,
    });

    if (newJob.err) {
      //console.log("ini newJob.err", newJob.err);
      logger.error(ctx, "duplicateJobPost", "Insert job failed", newJob.err);
      return wrapper.error(new InternalServerError("Failed to duplicate job"));
    }

    const newJobId = newJob.id;

    // 3️⃣ copy tags
    if (original.tags?.length) {
      for (const tag of original.tags) {
        await this.command.insertJobPostTag({
          job_post_id: newJobId,
          tag_id: tag.id,
        });
      }
    }

    // 4️⃣ copy requirements
    const requirementsResult = await this.query.getJobPostRequirements(id);
    if (!requirementsResult.err && requirementsResult.data && requirementsResult.data.length > 0) {
      const requirementsData = requirementsResult.data.map((req) => ({
        id: uuidv4(),
        job_post_id: newJobId,
        requirement: req.requirement,
        order_index: req.order_index,
      }));
      await this.command.insertMany(requirementsData, "job_post_requirements");
    }

    // 5️⃣ copy benefits
    const benefitsResult = await this.query.getJobPostBenefits(id);
    if (!benefitsResult.err && benefitsResult.data && benefitsResult.data.length > 0) {
      const benefitsData = benefitsResult.data.map((ben) => ({
        id: uuidv4(),
        job_post_id: newJobId,
        benefit: ben.benefit,
        order_index: ben.order_index,
      }));
      await this.command.insertMany(benefitsData, "job_post_benefits");
    }

    // 6️⃣ copy responsibilities
    const responsibilitiesResult = await this.query.getJobPostResponsibilities(id);
    if (!responsibilitiesResult.err && responsibilitiesResult.data && responsibilitiesResult.data.length > 0) {
      const responsibilitiesData = responsibilitiesResult.data.map((resp) => ({
        id: uuidv4(),
        job_post_id: newJobId,
        responsibility: resp.responsibility,
        order_index: resp.order_index,
      }));
      await this.command.insertMany(responsibilitiesData, "job_post_responsibilities");
    }

    // 7️⃣ copy questions
    const questionsResult = await this.query.findAllByJobPostId({
      job_post_id: id,
      conditions: "",
      orderColumn: "q.order_index",
      orderDirection: "ASC",
      idx: 2,
      values: [id],
      limit: 1000,
      page: 1,
    });
    if (!questionsResult.err && questionsResult.data && questionsResult.data.length > 0) {
      const questionsData = questionsResult.data.map((q) => ({
        id: uuidv4(),
        job_post_id: newJobId,
        question_text: q.question_text,
        question_type_id: q.question_type_id,
        options: q.options,
        is_required: q.is_required,
        order_index: q.order_index,
        created_at: new Date(),
        updated_at: new Date(),
      }));
      await this.command.insertMany(questionsData, "job_post_questions");
    }

    return wrapper.data({
      id: newJobId,
      message: "Job duplicated successfully",
    });
  }
  async archiveJobPost({ id, recruiter_id }) {
    const job = await this.query.findOneJobPost({ id, recruiter_id });

    if (job.err || !job.data) {
      return wrapper.error(
        new NotFoundError("Job not found or not owned by recruiter"),
      );
    }

    await this.command.archiveJobPost(id);
    return wrapper.data("Job archived");
  }

  async restoreJobPost({ id, recruiter_id }) {
    const job = await this.query.findOneJobPost({ id, recruiter_id });

    if (job.err || !job.data) {
      return wrapper.error(
        new NotFoundError("Job not found or not owned by recruiter"),
      );
    }

    await this.command.restoreJobPost(id);
    return wrapper.data("Job restored");
  }

  async deleteJobPost({ id, recruiter_id }) {
    const job = await this.query.findOneJobPost({ id, recruiter_id });

    if (job.err || !job.data) {
      return wrapper.error(
        new NotFoundError("Job not found or not owned by recruiter"),
      );
    }

    await this.command.deleteJobPost(id);
    return wrapper.data("Job deleted successfully");
  }
}   

module.exports = Jobpost;
