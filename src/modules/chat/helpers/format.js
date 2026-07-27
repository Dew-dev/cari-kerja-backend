/**
 * Shape raw chat query rows into FE-friendly payloads with user profile data.
 * `id` = workers.id / recruiters.id (same as login `user.id`)
 * `user_id` = users.id (used internally by chat tables / JWT)
 */

const { decrypt } = require("../../../helpers/utils/crypto_helper");

const plain = (value) => {
  if (value === null || value === undefined || value === "") return value ?? null;
  if (typeof value !== "string") return value;
  return decrypt(value);
};

const mapWorker = (row) => ({
  id: row.worker_profile_id || null,
  user_id: row.worker_id,
  username: plain(row.worker_username),
  name: plain(row.worker_name) || plain(row.worker_username) || null,
  avatar_url: row.worker_avatar || null,
});

const mapRecruiter = (row) => {
  const company = plain(row.recruiter_company);
  const contactName = plain(row.recruiter_name);
  const username = plain(row.recruiter_username);
  return {
    id: row.recruiter_profile_id || null,
    user_id: row.recruiter_id,
    username: username || null,
    name: contactName || company || username || null,
    company_name: company || null,
    avatar_url: row.recruiter_avatar || null,
  };
};

/**
 * @param {object} row
 * @param {string} [viewerUserId] - authenticated users.id; used to pick `participant` (the other party)
 */
const formatConversation = (row, viewerUserId) => {
  if (!row) return null;

  const worker = mapWorker(row);
  const recruiter = mapRecruiter(row);
  const participant =
    viewerUserId && String(viewerUserId) === String(row.worker_id)
      ? recruiter
      : viewerUserId && String(viewerUserId) === String(row.recruiter_id)
        ? worker
        : null;

  return {
    id: row.id,
    job_id: row.job_id || null,
    last_message: row.last_message || null,
    last_message_at: row.last_message_at || null,
    worker_unread: row.worker_unread ?? 0,
    recruiter_unread: row.recruiter_unread ?? 0,
    unread_count: row.unread_count ?? null,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    worker,
    recruiter,
    participant,
  };
};

const formatMessage = (row) => {
  if (!row) return null;

  // Prefer profile id (workers.id / recruiters.id) so FE can match login `user.id`
  const senderProfileId =
    row.sender_role_id === 1
      ? row.sender_worker_id
      : row.sender_role_id === 2
        ? row.sender_recruiter_id
        : null;

  return {
    id: row.id,
    conversation_id: row.conversation_id,
    message: row.message,
    type: row.type || "text",
    is_read: row.is_read ?? false,
    created_at: row.created_at,
    sender: {
      id: senderProfileId || null,
      user_id: row.sender_id,
      username: plain(row.sender_username),
      name: plain(row.sender_name) || plain(row.sender_username) || null,
      avatar_url: row.sender_avatar || null,
      company_name: plain(row.sender_company) || null,
      role_id: row.sender_role_id ?? null,
    },
  };
};

module.exports = {
  formatConversation,
  formatMessage,
};
