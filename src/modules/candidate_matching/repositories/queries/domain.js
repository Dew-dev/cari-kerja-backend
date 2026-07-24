const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, ForbiddenError } = require("../../../../helpers/errors");
const ctx = "CandidateMatching-Query-Domain";

class CandidateMatchingQuery {
  constructor(db) {
    this.query = new Query(db);
  }

  async getMatchByApplication({ application_id, recruiter_id }) {
    const app = await this.query.findApplicationContext(application_id);
    if (app.err || !app.data) {
      return wrapper.error(new NotFoundError("Application not found"));
    }
    if (app.data.recruiter_id !== recruiter_id) {
      return wrapper.error(
        new ForbiddenError("You are not allowed to view this application match"),
      );
    }

    let match = await this.query.findMatchByApplication(application_id);
    if (match.err) {
      logger.error(ctx, "getMatchByApplication", "query failed", match.err);
      return wrapper.error(new NotFoundError("Failed to load match score"));
    }

    // Lazy compute when still pending / missing so FE does not stay on "Calculating…"
    const needsCompute =
      !match.data ||
      match.data.match_status === "pending" ||
      match.data.match_score == null;

    if (needsCompute) {
      try {
        const CommandDomain = require("../commands/domain");
        const domain = new CommandDomain(this.query.db);
        const computed = await domain.computeApplicationMatch({
          application_id,
          force: true,
        });
        if (!computed.err && computed.data) {
          if (computed.data.match) {
            match = { err: null, data: computed.data.match };
          } else if (
            computed.data.application_id ||
            computed.data.match_status ||
            computed.data.match_score != null
          ) {
            match = { err: null, data: computed.data };
          }
        }
        if (!match.data || match.data.match_status === "pending") {
          const {
            enqueueComputeApplicationMatch,
          } = require("../../../../helpers/queues/matching.queue");
          await enqueueComputeApplicationMatch(application_id);
          match = await this.query.findMatchByApplication(application_id);
        }
      } catch (err) {
        logger.error(ctx, "getMatchByApplication", "lazy compute failed", err.message || err);
        const {
          enqueueOrComputeApplicationMatch,
        } = require("../../../../helpers/queues/matching.queue");
        await enqueueOrComputeApplicationMatch(application_id);
        match = await this.query.findMatchByApplication(application_id);
      }
    }

    if (!match.data) {
      return wrapper.data({
        application_id,
        job_post_id: app.data.job_post_id,
        worker_id: app.data.worker_id,
        match_score: null,
        match_status: "pending",
        match_breakdown: null,
        match_reasons: [],
        match_computed_at: null,
      });
    }

    return wrapper.data({
      application_id: match.data.application_id,
      job_post_id: match.data.job_post_id,
      worker_id: match.data.worker_id,
      match_score: match.data.match_score,
      match_status: match.data.match_status,
      match_breakdown: match.data.match_breakdown,
      match_reasons: match.data.match_reasons,
      model_version: match.data.model_version,
      match_computed_at: match.data.computed_at || match.data.match_computed_at,
    });
  }
}

module.exports = CandidateMatchingQuery;
