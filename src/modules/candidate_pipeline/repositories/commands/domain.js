const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
  InternalServerError,
} = require("../../../../helpers/errors");
const ctx = "CandidatePipeline-Command-Domain";

class CandidatePipeline {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async _verifyJobPostOwnership(job_post_id, recruiter_id) {
    const owner = await this.query.findJobPostOwner(job_post_id);
    if (owner.err || !owner.data) {
      return wrapper.error(new NotFoundError("Job post not found"));
    }
    if (owner.data.recruiter_id !== recruiter_id) {
      return wrapper.error(new ForbiddenError("You are not allowed to access this job post"));
    }
    return wrapper.data(owner.data);
  }

  async createStage(payload) {
    const { job_post_id, recruiter_id, name, stage_type, position } = payload;

    const ownership = await this._verifyJobPostOwnership(job_post_id, recruiter_id);
    if (ownership.err) return ownership;

    // pastikan stage default sudah ada agar posisi baru konsisten
    await this.query.ensureStagesForJobPost(job_post_id);

    let finalPosition = position;
    if (finalPosition === undefined) {
      const maxPosition = await this.query.findMaxStagePosition(job_post_id);
      finalPosition = (maxPosition.err ? -1 : maxPosition.data) + 1;
    }

    try {
      const result = await this.command.insertStage({
        job_post_id,
        name,
        stage_type: stage_type || "custom",
        position: finalPosition,
        color: null,
      });

      if (!result || !result.rows || result.rows.length === 0) {
        return wrapper.error(new InternalServerError("Failed to create stage"));
      }

      return wrapper.data(result.rows[0]);
    } catch (err) {
      if (err?.code === "23505") {
        return wrapper.error(new ConflictError("Stage dengan nama tersebut sudah ada"));
      }
      logger.error(ctx, "createStage", "Failed to create stage", err);
      return wrapper.error(new InternalServerError("Failed to create stage"));
    }
  }

  async updateStage(payload) {
    const { job_post_id, recruiter_id, stage_id, name, color, position } = payload;

    const ownership = await this._verifyJobPostOwnership(job_post_id, recruiter_id);
    if (ownership.err) return ownership;

    const stage = await this.query.findStageById({ stage_id, job_post_id });
    if (stage.err || !stage.data) {
      return wrapper.error(new NotFoundError("Stage not found for this job post"));
    }

    try {
      const result = await this.command.updateStage({ stage_id, name, color, position });
      if (!result || !result.rows || result.rows.length === 0) {
        return wrapper.error(new InternalServerError("Failed to update stage"));
      }
      return wrapper.data(result.rows[0]);
    } catch (err) {
      if (err?.code === "23505") {
        return wrapper.error(new ConflictError("Stage dengan nama tersebut sudah ada"));
      }
      logger.error(ctx, "updateStage", "Failed to update stage", err);
      return wrapper.error(new InternalServerError("Failed to update stage"));
    }
  }

  async reorderStages(payload) {
    const { job_post_id, recruiter_id, stages } = payload;

    const ownership = await this._verifyJobPostOwnership(job_post_id, recruiter_id);
    if (ownership.err) return ownership;

    for (const s of stages) {
      const stage = await this.query.findStageById({ stage_id: s.id, job_post_id });
      if (stage.err || !stage.data) {
        return wrapper.error(new BadRequestError(`Stage ${s.id} tidak ditemukan untuk job post ini`));
      }
    }

    for (const s of stages) {
      await this.command.updateStagePosition({ stage_id: s.id, position: s.position });
    }

    const updated = await this.query.findStagesByJobPost(job_post_id);
    if (updated.err) {
      return wrapper.error(new InternalServerError("Failed to reorder stages"));
    }

    return wrapper.data(updated.data);
  }

  async deleteStage(payload) {
    const { job_post_id, recruiter_id, stage_id } = payload;

    const ownership = await this._verifyJobPostOwnership(job_post_id, recruiter_id);
    if (ownership.err) return ownership;

    const stage = await this.query.findStageById({ stage_id, job_post_id });
    if (stage.err || !stage.data) {
      return wrapper.error(new NotFoundError("Stage not found for this job post"));
    }

    if (stage.data.is_system) {
      return wrapper.error(new BadRequestError("Tidak dapat menghapus stage sistem"));
    }

    const usage = await this.query.countApplicationsByStage(stage_id);
    if (!usage.err && usage.data > 0) {
      return wrapper.error(
        new BadRequestError("Tidak dapat menghapus stage yang masih memiliki kandidat"),
      );
    }

    await this.command.deleteStage(stage_id);
    return wrapper.data("Stage deleted successfully");
  }
}

module.exports = CandidatePipeline;
