/**
 * Shape raw chat query rows into FE-friendly payloads with user profile data.
 */

const mapWorker = (row) => ({
  id: row.worker_id,
  username: row.worker_username || null,
  name: row.worker_name || row.worker_username || null,
  avatar_url: row.worker_avatar || null,
});

const mapRecruiter = (row) => ({
  id: row.recruiter_id,
  username: row.recruiter_username || null,
  name: row.recruiter_name || row.recruiter_company || row.recruiter_username || null,
  company_name: row.recruiter_company || null,
  avatar_url: row.recruiter_avatar || null,
});

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

  return {
    id: row.id,
    conversation_id: row.conversation_id,
    message: row.message,
    type: row.type || "text",
    is_read: row.is_read ?? false,
    created_at: row.created_at,
    sender: {
      id: row.sender_id,
      username: row.sender_username || null,
      name: row.sender_name || row.sender_username || null,
      avatar_url: row.sender_avatar || null,
      company_name: row.sender_company || null,
      role_id: row.sender_role_id ?? null,
    },
  };
};

module.exports = {
  formatConversation,
  formatMessage,
};
