const { v4: uuidv4 } = require("uuid");
const wrapper = require("../../helpers/utils/wrapper");
const logger = require("../../helpers/utils/logger");
const config = require("../../config/global_config");
const { getIO } = require("../../helpers/socket");
const ChatCommand = require("../chat/repositories/commands/command");
const ChatQuery = require("../chat/repositories/queries/query");
const { formatMessage } = require("../chat/helpers/format");
const jobAlertsChatTemplate = require("../../helpers/utils/jobAlertsChatTemplate");
const { InternalServerError, NotFoundError } = require("../../helpers/errors");

const ctx = "JobAlertChat";
const BOT_ROLE_ID = 2;
const MESSAGE_TYPE = "job_alert";

const DEFAULT_BOT_USER_ID = "a0000000-0000-4000-8000-000000000001";

function isChatEnabled() {
  return config.get("/jobAlerts/chatEnabled") !== false;
}

function getBotUserId() {
  return config.get("/jobAlerts/chatUserId") || DEFAULT_BOT_USER_ID;
}

/**
 * Ensure the system bot user exists (migration 032 or Super Admin seed).
 */
async function resolveBotUser(db, botUserId) {
  try {
    const res = await db.executeQuery(
      `SELECT u.id, u.role_id, r.id AS recruiter_id
       FROM users u
       LEFT JOIN recruiters r ON r.user_id = u.id AND r.deleted_at IS NULL
       WHERE u.id = $1
         AND u.role_id = $2
         AND u.deleted_at IS NULL
       LIMIT 1`,
      [botUserId, BOT_ROLE_ID],
    );
    const row = res?.rows?.[0];
    if (!row) {
      return wrapper.error(
        new NotFoundError(
          `Job alerts chat bot user not found (${botUserId}). Apply migration 032 or set JOB_ALERTS_CHAT_USER_ID.`,
        ),
      );
    }
    if (!row.recruiter_id) {
      return wrapper.error(
        new NotFoundError(
          `Job alerts chat bot has no recruiters row for user ${botUserId}.`,
        ),
      );
    }
    return wrapper.data(row);
  } catch (err) {
    logger.error(ctx, "resolveBotUser failed", "service", err);
    return wrapper.error(new InternalServerError("Failed to resolve job alerts chat bot"));
  }
}

async function findOrCreateConversation(db, workerUserId, botUserId) {
  const existing = await db.executeQuery(
    `SELECT *
     FROM conversations
     WHERE worker_id = $1
       AND recruiter_id = $2
       AND job_id IS NULL
     LIMIT 1`,
    [workerUserId, botUserId],
  );
  if (existing?.rows?.[0]) {
    return wrapper.data(existing.rows[0]);
  }

  const command = new ChatCommand(db);
  const created = await command.createConversation({
    id: uuidv4(),
    worker_id: workerUserId,
    recruiter_id: botUserId,
    job_id: null,
  });

  if (!created.err && created.data) {
    return created;
  }

  // Concurrent insert race → unique index; re-fetch
  const again = await db.executeQuery(
    `SELECT *
     FROM conversations
     WHERE worker_id = $1
       AND recruiter_id = $2
       AND job_id IS NULL
     LIMIT 1`,
    [workerUserId, botUserId],
  );
  if (again?.rows?.[0]) {
    return wrapper.data(again.rows[0]);
  }

  return wrapper.error(created.err || new InternalServerError("Failed to create job alert conversation"));
}

/**
 * Deliver a daily job recommendation digest into the worker's chat inbox.
 * Bypasses normal sendMessage (velocity / start-chat gates) via insertMessageWithTransaction.
 *
 * @param {object} db - PostgreSQL DB helper
 * @param {{ user_id: string, worker_name?: string }} worker
 * @param {Array} jobs
 * @param {{ botUserId?: string }} [options]
 */
async function deliverJobAlertChat(db, worker, jobs, options = {}) {
  if (!isChatEnabled()) {
    return wrapper.data({ skipped: true, reason: "chat_disabled" });
  }

  const workerUserId = worker?.user_id;
  if (!workerUserId) {
    return wrapper.error(new InternalServerError("worker.user_id is required for chat delivery"));
  }
  if (!jobs || jobs.length === 0) {
    return wrapper.data({ skipped: true, reason: "no_jobs" });
  }

  const botUserId = options.botUserId || getBotUserId();
  const bot = await resolveBotUser(db, botUserId);
  if (bot.err) {
    return bot;
  }

  const conversation = await findOrCreateConversation(db, workerUserId, botUserId);
  if (conversation.err || !conversation.data) {
    return conversation;
  }

  const text = jobAlertsChatTemplate({
    name: worker.worker_name,
    jobs,
  });

  const command = new ChatCommand(db);
  const messageId = uuidv4();
  const inserted = await command.insertMessageWithTransaction(
    {
      id: messageId,
      conversation_id: conversation.data.id,
      sender_id: botUserId,
      message: text,
      type: MESSAGE_TYPE,
    },
    BOT_ROLE_ID,
  );

  if (inserted.err) {
    return inserted;
  }

  const query = new ChatQuery(db);
  const enriched = await query.getMessageById(messageId);
  const payload = enriched.err
    ? formatMessage({
        ...inserted.data,
        sender_role_id: BOT_ROLE_ID,
        sender_name: "Job Alerts",
        sender_company: "Cari Kerja Recommendations",
      })
    : formatMessage(enriched.data);

  try {
    const io = getIO();
    if (io && conversation.data.id) {
      io.to(String(conversation.data.id)).emit("receive_message", payload);
    }
  } catch (err) {
    logger.error(ctx, "socket emit failed (message still saved)", "service", err);
  }

  return wrapper.data({
    conversation_id: conversation.data.id,
    message_id: messageId,
    message: payload,
  });
}

module.exports = {
  DEFAULT_BOT_USER_ID,
  MESSAGE_TYPE,
  isChatEnabled,
  getBotUserId,
  resolveBotUser,
  deliverJobAlertChat,
};
