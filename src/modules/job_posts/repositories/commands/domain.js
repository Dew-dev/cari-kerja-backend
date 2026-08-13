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
  ForbiddenError,
} = require("../../../../helpers/errors");
const PaymentQuery = require("../../../payments/repositories/queries/query");
const CandidatePipelineQuery = require("../../../candidate_pipeline/repositories/queries/query");
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
const statusEmailTemplate = require("../../../../helpers/utils/statusEmailTemplate");
const {
  assertRecruiterVerifiedForPublish,
  isOpenJobStatus,
} = require("../../../../helpers/fraud/employer_verification");
const { assertApplyVelocity } = require("../../../../helpers/fraud/velocity");
const {
  scoreJobPost,
  PENDING_JOB_STATUS_ID,
} = require("../../../../helpers/fraud/score_job_post");
const { upsertOpenFraudEvent } = require("../../../../helpers/fraud/fraud_events");
const {
  enqueueComputeApplicationMatch,
  enqueueOrComputeApplicationMatch,
  enqueueRecomputeJobMatches,
} = require("../../../../helpers/queues/matching.queue");
const {
  syncJobPostSafe,
  deleteJobPostSafe,
} = require("../../services/elasticsearch_job_search");
const {
  resolveJobTitle,
  JobTitleResolveError,
} = require("../../../job_titles/helpers/resolve_job_title");

class Jobpost {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
    this.paymentQuery = new PaymentQuery(db);
    this.candidatePipelineQuery = new CandidatePipelineQuery(db);
  }

  async createJobPost(payload) {
    const {
      recruiter_id,
      company_id,
      created_by_user_id,
      title,
      job_title_id,
      job_title,
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
      is_remote,
    } = payload;

    // ======================================
    // SUBSCRIPTION QUOTA ENFORCEMENT (company-wide)
    // ======================================
    const quotaCheckResult = await this._checkPostingQuota(company_id || recruiter_id);
    if (quotaCheckResult.err) {
      return wrapper.error(quotaCheckResult.err);
    }
    // ======================================

    // Unverified employers may create DRAFT/PENDING/etc., but not OPEN.
    if (isOpenJobStatus(status_id)) {
      const verified = await assertRecruiterVerifiedForPublish(
        this.command.db,
        recruiter_id
      );
      if (verified.err) {
        return verified;
      }
    }

    let effectiveStatusId = status_id;
    let moderation = null;
    if (isOpenJobStatus(status_id)) {
      const score = scoreJobPost({
        title,
        description,
        location,
        requirements,
        benefits,
        responsibilities,
      });
      if (score.needs_review) {
        effectiveStatusId = PENDING_JOB_STATUS_ID;
        moderation = score;
      }
    }

    let resolvedTitle;
    try {
      resolvedTitle = await resolveJobTitle(
        { id: job_title_id, name: job_title || title, category_id },
        this.command.db
      );
    } catch (err) {
      if (err instanceof JobTitleResolveError || err?.name === "JobTitleResolveError") {
        return wrapper.error(new BadRequestError(err.message));
      }
      throw err;
    }
    // Keep marketing headline unless client only sent taxonomy name with empty title
    const headline =
      (!title || !String(title).trim()) && job_title && resolvedTitle
        ? resolvedTitle.name
        : title;

    const jobPostId = uuidv4();
    const data = {
      recruiter_id,
      company_id: company_id || null,
      created_by_recruiter_id: recruiter_id,
      created_by_user_id: created_by_user_id || null,
      title: headline,
      job_title_id: resolvedTitle?.id || null,
      description,
      employment_type_id,
      experience_level_id,
      salary_type_id,
      location,
      salary_min,
      salary_max,
      currency_id,
      status_id: effectiveStatusId,
      deadline,
      category_id,
      province,
      city,
      is_remote: is_remote ?? false,
    };

    const result = await this.command.insertJobPost(data);
    if (!result || result.err) {
      logger.error(ctx, "Create job post", "Job Posts Commands", result?.err);
      return wrapper.error(new InternalServerError("Create Job Post Failed"));
    }

    const actualJobPostId = result.id || jobPostId;

    const failNestedCreate = async (message, err) => {
      logger.error(ctx, message, "Job Posts Commands", err);
      try {
        await this.command.deleteJobPost(actualJobPostId);
      } catch (rollbackErr) {
        logger.error(ctx, "Rollback job post after nested insert failure", "Job Posts Commands", rollbackErr);
      }
      return wrapper.error(new InternalServerError(message));
    };

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
        return failNestedCreate("Create job post requirements failed", reqResult.err);
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
        return failNestedCreate("Create job post benefits failed", benResult.err);
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
        return failNestedCreate("Create job post responsibilities failed", respResult.err);
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
      if (skillResult.err) {
        return failNestedCreate("Create job post skills failed", skillResult.err);
      }
    }

    const questionPayload = Array.isArray(job_post_questions)
      ? job_post_questions
      : Array.isArray(questions)
        ? questions
        : null;
    if (questionPayload && questionPayload.length > 0) {
      const questionResult = await this.createJobPostQuestions(
        questionPayload,
        actualJobPostId,
        ctx,
      );
      if (questionResult.err) {
        return failNestedCreate("Create job post questions failed", questionResult.err);
      }
    }

    if (moderation) {
      await upsertOpenFraudEvent(this.command.db, {
        entity_type: "job_post",
        entity_id: actualJobPostId,
        source: "job_content_heuristics",
        risk_score: moderation.risk_score,
        flags: moderation.flags,
        summary: `Job content flagged (score ${moderation.risk_score}): ${moderation.flags
          .map((f) => f.code)
          .join(", ")}`,
        metadata: { title, recruiter_id },
      });
      syncJobPostSafe(this.command.db, actualJobPostId);
      return wrapper.data(
        { ...data, id: actualJobPostId, moderation },
        "CONTENT_FLAGGED: Job held for review due to content risk"
      );
    }

    syncJobPostSafe(this.command.db, actualJobPostId);
    return wrapper.data({ ...data, id: actualJobPostId });
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

      const recruiterId = payload.recruiter_id;
      if (!recruiterId) {
        return wrapper.error(
          new ForbiddenError("Recruiter context required to update job status"),
        );
      }

      const job = await this.query.findOneJobPost({
        id,
        recruiter_id: recruiterId,
        company_id: payload.company_id,
      });
      if (job.err || !job.data) {
        return wrapper.error(
          new NotFoundError("Job not found or not owned by recruiter"),
        );
      }

      if (isOpenJobStatus(value.status_id)) {
        const verified = await assertRecruiterVerifiedForPublish(
          this.command.db,
          recruiterId
        );
        if (verified.err) {
          return verified;
        }
      }

      let effectiveStatusId = value.status_id;
      let moderation = null;
      if (isOpenJobStatus(value.status_id)) {
        const contentResult = await this.command.db.executeQuery(
          `SELECT title, description, location FROM job_posts WHERE id = $1 LIMIT 1`,
          [id]
        );
        const content = contentResult?.rows?.[0] || {};
        const score = scoreJobPost(content);
        if (score.needs_review) {
          effectiveStatusId = PENDING_JOB_STATUS_ID;
          moderation = score;
          await upsertOpenFraudEvent(this.command.db, {
            entity_type: "job_post",
            entity_id: id,
            source: "job_content_heuristics",
            risk_score: score.risk_score,
            flags: score.flags,
            summary: `Publish blocked by content heuristics (score ${score.risk_score})`,
            metadata: { recruiter_id: recruiterId, title: content.title },
          });
        }
      }

      const parameter = { id: id };
      const updateQuery = {
        status_id: effectiveStatusId,
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

      if (moderation) {
        syncJobPostSafe(this.command.db, id);
        return wrapper.data(
          { ...result.data, moderation },
          "CONTENT_FLAGGED: Job held for review due to content risk"
        );
      }

      syncJobPostSafe(this.command.db, id);
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
        answers, // array of { question_id, answer_text }
      } = payload;

      const ctx = "Job Applications Commands";

      const existing = await this.query.findOne(
        { job_post_id, worker_id }, // parameter
        { id: true }, // projection (kolom apa yang mau diambil)
        "job_applications", // nama tabel
      );
      if (existing.data) {
        return wrapper.error(
          new ConflictError(
            "DUPLICATE_SUBMISSION: Anda sudah melamar pekerjaan ini."
          ),
        );
      }

      const velocity = await assertApplyVelocity(this.command.db, worker_id);
      if (velocity.err) {
        return velocity;
      }

      // application_status_id selalu di-resolve oleh backend, tidak pernah
      // dipercayakan ke client. Pastikan stage default (6 stage) sudah
      // ter-seed untuk job post ini, lalu ambil stage dengan stage_type='applied'.
      const stagesResult = await this.candidatePipelineQuery.ensureStagesForJobPost(
        job_post_id,
      );
      if (stagesResult.err) {
        logger.error(
          ctx,
          "Create Job Application",
          "Failed to ensure stages for job post",
          stagesResult.err,
        );
        return wrapper.error(
          new InternalServerError("Failed to resolve application stage"),
        );
      }

      const appliedStage = (stagesResult.data || []).find(
        (stage) => stage.stage_type === "applied",
      );
      if (!appliedStage) {
        logger.error(
          ctx,
          "Create Job Application",
          "Applied stage not found for job post",
          { job_post_id },
        );
        return wrapper.error(
          new InternalServerError("Applied stage not configured for this job post"),
        );
      }

      const data = {
        id: uuidv4(),
        job_post_id,
        worker_id,
        resume_id,
        cover_letter,
        application_status_id: appliedStage.id,
        applied_at: new Date(),
        updated_at: new Date(),
      };

      // insert ke job_applications
      const result = await this.command.insertOne(data, "job_applications");
      if (result.err) {
        const message = result.err.message || "";
        const isDuplicate =
          result.err.code === "23505" ||
          /duplicate key|unique constraint/i.test(message);
        if (isDuplicate) {
          return wrapper.error(
            new ConflictError(
              "DUPLICATE_SUBMISSION: Anda sudah melamar pekerjaan ini."
            ),
          );
        }
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
          // Rollback application insert when answers fail
          await this.command.deleteOne({ id: data.id }, "job_applications");
          return wrapper.error(
            new InternalServerError("Create Job Post Answers Failed"),
          );
        }
      }

      // await client.query("COMMIT");

      await enqueueOrComputeApplicationMatch(data.id);

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
      return wrapper.error(
        new NotFoundError("Application not found or already withdrawn"),
      );
    }

    return wrapper.data("Application withdrawn successfully");
  }

  async updateApplicationStatus(payload) {
    const { id, application_status_id, recruiter_id, company_id } = payload;

    // 1. Ambil application + job_post
    const application = await this.query.findOneJobApplication({
      id,
    });

    if (application.err || !application.data) {
      return wrapper.error(new NotFoundError("Application not found"));
    }

    // 2. Pastikan company/recruiter pemilik job
    const ownsByCompany =
      company_id &&
      application.data.company_id &&
      application.data.company_id === company_id;
    const ownsByRecruiter = application.data.recruiter_id === recruiter_id;
    if (!ownsByCompany && !ownsByRecruiter) {
      return wrapper.error(
        new ForbiddenError("You are not allowed to update this application"),
      );
    }

    // 2.5. Pastikan stage tujuan milik job post yang sama dengan aplikasi ini
    const stage = await this.query.findStageForValidation({
      id: application_status_id,
      job_post_id: application.data.job_post_id,
    });

    if (stage.err || !stage.data) {
      return wrapper.error(
        new BadRequestError("Stage tidak ditemukan untuk job post ini"),
      );
    }

    const previousStatusId = application.data.application_status_id;

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

    // 3.5. Catat riwayat perpindahan stage
    await this.command.insertApplicationStageHistory({
      application_id: id,
      from_stage_id: previousStatusId,
      to_stage_id: application_status_id,
      changed_by_recruiter_id: recruiter_id,
      note: null,
    });

    const app = await this.query.findApplicationWithUser(id);
    if (app.err || !app.data) {
      return wrapper.error(new NotFoundError("Application not found"));
    }

    // Multi-channel notify (email + telegram). Channels are independent.
    try {
      const config = require("../../../../config/global_config");
      const notificationService = require("../../../../helpers/notifications/NotificationService");
      const feUrl = (config.get("/frontendUrl") || "").replace(/\/$/, "");
      const actionUrl = feUrl
        ? `${feUrl}/jobposts/${app.data.job_post_id}`
        : undefined;

      const stageName = String(app.data.status_name || "");
      const isInterview = /interview|wawancara/i.test(stageName);
      const notifyType = isInterview
        ? "interview_invitation"
        : "application_status";

      const hasEmail = Boolean(app.data.email && String(app.data.email).trim());
      const emailPayload = hasEmail
        ? {
            to: app.data.email,
            subject: `Update lamaran — ${app.data.job_title}`,
            html: statusEmailTemplate({
              name: app.data.worker_name || app.data.user_name,
              jobTitle: app.data.job_title,
              status: app.data.status_name,
              stageName: app.data.status_name,
              companyName: app.data.company_name,
              actionUrl,
            }),
          }
        : null;

      await notificationService.notify({
        user: {
          id: app.data.user_id,
          email: app.data.email,
          login_provider: app.data.login_provider,
          telegram_chat_id: app.data.telegram_chat_id,
          name: app.data.worker_name || app.data.user_name,
        },
        type: notifyType,
        data: {
          name: app.data.worker_name || app.data.user_name,
          jobTitle: app.data.job_title,
          status: app.data.status_name,
          stageName: app.data.status_name,
          companyName: app.data.company_name,
          actionUrl,
        },
        email: emailPayload,
      });
    } catch (e) {
      logger.error(ctx, "changeApplicationStatus", "Notify failed", e);
    }

    return wrapper.data("Application status updated successfully");
  }

  async updateJobPost(payload) {
    
    console.log("skillResult (update):", payload);
    const { id, recruiter_id, user_id, tags, job_post_questions, questions, skills, province, city, is_remote, job_title_id, job_title, ...jobData } = payload;

    // 1️⃣ cek job milik recruiter
    const job = await this.query.findOneJobPost({
      id,
      recruiter_id,
      company_id: payload.company_id,
    });

    if (job.err || !job.data) {
      return wrapper.error(
        new NotFoundError("Job not found or not owned by recruiter"),
      );
    }

    if (isOpenJobStatus(jobData.status_id)) {
      const verified = await assertRecruiterVerifiedForPublish(
        this.command.db,
        recruiter_id
      );
      if (verified.err) {
        return verified;
      }

      const contentResult = await this.command.db.executeQuery(
        `SELECT title, description, location FROM job_posts WHERE id = $1 LIMIT 1`,
        [id]
      );
      const existing = contentResult?.rows?.[0] || {};
      const score = scoreJobPost({
        title: jobData.title ?? existing.title,
        description: jobData.description ?? existing.description,
        location: jobData.location ?? job.data.location ?? existing.location,
        requirements,
        benefits,
        responsibilities,
      });
      if (score.needs_review) {
        jobData.status_id = PENDING_JOB_STATUS_ID;
        await upsertOpenFraudEvent(this.command.db, {
          entity_type: "job_post",
          entity_id: id,
          source: "job_content_heuristics",
          risk_score: score.risk_score,
          flags: score.flags,
          summary: `Update-to-OPEN blocked by content heuristics (score ${score.risk_score})`,
          metadata: { recruiter_id, title: jobData.title ?? existing.title },
        });
        payload = {
          ...payload,
          status_id: PENDING_JOB_STATUS_ID,
          moderation: score,
        };
      }
    }

    let resolvedTitle;
    try {
      resolvedTitle = await resolveJobTitle(
        {
          id: job_title_id,
          name: job_title || jobData.title,
          category_id: jobData.category_id ?? job.data.category_id,
        },
        this.command.db
      );
    } catch (err) {
      if (err instanceof JobTitleResolveError || err?.name === "JobTitleResolveError") {
        return wrapper.error(new BadRequestError(err.message));
      }
      throw err;
    }
    if (
      (!jobData.title || !String(jobData.title).trim()) &&
      job_title &&
      resolvedTitle
    ) {
      jobData.title = resolvedTitle.name;
    }

    // 2️⃣ update job_posts - preserve existing values for fields not provided
    const updateResult = await this.command.updateJobPost({
      id,
      ...jobData,
      job_title_id: resolvedTitle?.id ?? job_title_id ?? null,
      location: jobData.location ?? job.data.location,
      province: province ?? job.data.province,
      city: city ?? job.data.city,
      is_remote: is_remote ?? job.data.is_remote,
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

    const shouldRecomputeMatches =
      skills !== undefined ||
      jobData.description !== undefined ||
      jobData.title !== undefined ||
      jobData.experience_level_id !== undefined;

    if (shouldRecomputeMatches) {
      await enqueueRecomputeJobMatches(id);
    }

    syncJobPostSafe(this.command.db, id);
    return wrapper.data(
      payload,
      payload?.moderation
        ? "CONTENT_FLAGGED: Job held for review due to content risk"
        : null
    );
  }



  async duplicateJobPost(payload) {
    const { id, recruiter_id } = payload;

    // 1️⃣ ambil job asli dengan semua relasi
    const job = await this.query.findJobWithTags({
      id,
      recruiter_id,
      company_id: payload.company_id,
    });

    if (job.err || !job.data) {
      return wrapper.error(
        new NotFoundError("Job not found or not owned by recruiter"),
      );
    }

    // Kuota posting berlaku juga untuk duplicate (sebelumnya bypass)
    const quotaCheckResult = await this._checkPostingQuota(
      original.company_id || recruiter_id
    );
    if (quotaCheckResult.err) {
      return wrapper.error(quotaCheckResult.err);
    }

    const original = job.data;

    // 2️⃣ create job baru (DRAFT)
    // is_remote is NOT NULL — must pass a boolean (explicit NULL bypasses DB default).
    let newJob;
    try {
      newJob = await this.command.insertJobPost({
        recruiter_id,
        title: `${original.title} (Copy)`,
        job_title_id: original.job_title_id ?? null,
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
        province: original.province ?? null,
        city: original.city ?? null,
        is_remote: original.is_remote ?? false,
      });
    } catch (err) {
      logger.error(ctx, "duplicateJobPost", "Insert job failed", err);
      return wrapper.error(new InternalServerError("Failed to duplicate job"));
    }

    if (!newJob || newJob.err || !newJob.id) {
      logger.error(ctx, "duplicateJobPost", "Insert job failed", newJob?.err || newJob);
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

    syncJobPostSafe(this.command.db, newJobId);
    return wrapper.data({
      id: newJobId,
      message: "Job duplicated successfully",
    });
  }
  async archiveJobPost({ id, recruiter_id }) {
    const job = await this.query.findOneJobPost({ id, recruiter_id, company_id: payload.company_id });

    if (job.err || !job.data) {
      return wrapper.error(
        new NotFoundError("Job not found or not owned by recruiter"),
      );
    }

    await this.command.archiveJobPost(id);
    syncJobPostSafe(this.command.db, id);
    return wrapper.data("Job archived");
  }

  async restoreJobPost({ id, recruiter_id }) {
    const job = await this.query.findOneJobPost({ id, recruiter_id, company_id: payload.company_id });

    if (job.err || !job.data) {
      return wrapper.error(
        new NotFoundError("Job not found or not owned by recruiter"),
      );
    }

    await this.command.restoreJobPost(id);
    syncJobPostSafe(this.command.db, id);
    return wrapper.data("Job restored");
  }

  async deleteJobPost({ id, recruiter_id }) {
    const job = await this.query.findOneJobPost({ id, recruiter_id, company_id: payload.company_id });

    if (job.err || !job.data) {
      return wrapper.error(
        new NotFoundError("Job not found or not owned by recruiter"),
      );
    }

    await this.command.deleteJobPost(id);
    deleteJobPostSafe(id);
    return wrapper.data("Job deleted successfully");
  }

  /**
   * Cek kuota posting company-wide berdasarkan subscription plan aktif.
   * Default: Paket Free = 1 job post aktif.
   */
  async _checkPostingQuota(company_id) {
    try {
      const subResult = await this.paymentQuery.getActiveSubscription(company_id);
      const activeSubscription = subResult?.rows?.[0] || null;

      const maxActivePosts = activeSubscription ? parseInt(activeSubscription.max_active_posts, 10) : 1;

      const countResult = await this.paymentQuery.countActiveJobPostsFallback(company_id);
      const currentActive = parseInt(countResult?.rows?.[0]?.count || 0, 10);

      if (currentActive >= maxActivePosts) {
        const planName = activeSubscription ? activeSubscription.plan_display_name : "Paket Free";
        return wrapper.error(
          new ForbiddenError(
            `Batas posting perusahaan sudah penuh (${currentActive}/${maxActivePosts} iklan aktif pada ${planName}). ` +
            `Upgrade paket perusahaan untuk menambah lebih banyak iklan.`
          )
        );
      }

      return wrapper.data({ allowed: true, currentActive, maxActivePosts });
    } catch (err) {
      logger.error(ctx, "_checkPostingQuota", "Error checking quota", err);
      return wrapper.error(
        new InternalServerError("Failed to verify posting quota. Please try again.")
      );
    }
  }
}

module.exports = Jobpost;

