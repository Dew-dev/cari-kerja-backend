const wrapper = require("../utils/wrapper");
const { ForbiddenError, BadRequestError } = require("../errors");

/**
 * Block if either user blocked the other (symmetric messaging ban).
 * @param {{ executeQuery: Function }} db
 * @param {string} userIdA
 * @param {string} userIdB
 */
const assertUsersNotBlocked = async (db, userIdA, userIdB) => {
  if (!userIdA || !userIdB) {
    return wrapper.error(new BadRequestError("Both user ids are required for block check"));
  }
  if (userIdA === userIdB) {
    return wrapper.data({ ok: true });
  }

  const result = await db.executeQuery(
    `
    SELECT 1
    FROM chat_blocks
    WHERE (blocker_user_id = $1 AND blocked_user_id = $2)
       OR (blocker_user_id = $2 AND blocked_user_id = $1)
    LIMIT 1
    `,
    [userIdA, userIdB]
  );

  if (result?.rows?.length) {
    return wrapper.error(
      new ForbiddenError(
        "CHAT_BLOCKED: Messaging is not allowed between these users"
      )
    );
  }

  return wrapper.data({ ok: true });
};

/**
 * Worker may start a *new* conversation only if they applied to a job of that recruiter.
 * Recruiters may initiate freely. Existing threads are always allowed (checked by caller).
 * @param {{ executeQuery: Function }} db
 * @param {string} workerUserId users.id
 * @param {string} recruiterUserId users.id
 */
const assertWorkerCanStartChat = async (db, workerUserId, recruiterUserId) => {
  const result = await db.executeQuery(
    `
    SELECT 1
    FROM job_applications ja
    JOIN workers w ON w.id = ja.worker_id AND w.deleted_at IS NULL
    JOIN job_posts jp ON jp.id = ja.job_post_id AND jp.deleted_at IS NULL
    JOIN recruiters r ON r.id = jp.recruiter_id AND r.deleted_at IS NULL
    WHERE w.user_id = $1
      AND r.user_id = $2
      AND ja.deleted_at IS NULL
    LIMIT 1
    `,
    [workerUserId, recruiterUserId]
  );

  if (!result?.rows?.length) {
    return wrapper.error(
      new ForbiddenError(
        "CHAT_GATE: Workers may only start chat after applying to this employer's job"
      )
    );
  }

  return wrapper.data({ ok: true });
};

module.exports = {
  assertUsersNotBlocked,
  assertWorkerCanStartChat,
};
