const wrapper = require("../utils/wrapper");
const { ForbiddenError, NotFoundError } = require("../errors");

/** job_post_statuses.id untuk OPEN (publik). */
const OPEN_JOB_STATUS_ID = 1;

/**
 * Gate publish: recruiter harus is_verified sebelum status OPEN.
 * @param {{ executeQuery: Function }} db
 * @param {string} recruiterId
 */
const assertRecruiterVerifiedForPublish = async (db, recruiterId) => {
  if (!recruiterId) {
    return wrapper.error(new ForbiddenError("VERIFICATION_REQUIRED: Company must be verified before publishing jobs"));
  }

  const result = await db.executeQuery(
    `SELECT is_verified FROM recruiters WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
    [recruiterId]
  );

  if (!result?.rows?.length) {
    return wrapper.error(new NotFoundError("Employer not found"));
  }

  if (!result.rows[0].is_verified) {
    return wrapper.error(
      new ForbiddenError(
        "VERIFICATION_REQUIRED: Company must be verified before publishing jobs"
      )
    );
  }

  return wrapper.data({ ok: true });
};

const isOpenJobStatus = (statusId) => Number(statusId) === OPEN_JOB_STATUS_ID;

module.exports = {
  OPEN_JOB_STATUS_ID,
  assertRecruiterVerifiedForPublish,
  isOpenJobStatus,
};
