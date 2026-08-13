const ROLE_RANK = {
  owner: 3,
  admin: 2,
  recruiter: 1,
};

const canEditCompany = (role) => role === "owner" || role === "admin";
const canManageTeam = (role) => role === "owner" || role === "admin";
const canManageBilling = (role) => role === "owner";
const canManageVerification = (role) => role === "owner" || role === "admin";
const canUseJobs = (role) => Boolean(ROLE_RANK[role]);

const canAssignRole = (actorRole, targetRole) => {
  if (!canManageTeam(actorRole)) return false;
  if (targetRole === "owner") return false;
  return (ROLE_RANK[actorRole] || 0) >= (ROLE_RANK[targetRole] || 0);
};

/**
 * Load active company membership for a user.
 * @returns {Promise<{company_id: string, company_role: string, recruiter_id: string|null, verification_status: string|null}|null>}
 */
const loadCompanyMembership = async (db, userId) => {
  if (!db || !userId) return null;
  const result = await db.executeQuery(
    `
    SELECT
      cm.company_id,
      cm.role AS company_role,
      r.id AS recruiter_id,
      c.verification_status,
      c.is_verified,
      c.is_vip
    FROM company_members cm
    INNER JOIN companies c ON c.id = cm.company_id AND c.deleted_at IS NULL
    LEFT JOIN recruiters r ON r.user_id = cm.user_id AND r.company_id = cm.company_id
    WHERE cm.user_id = $1
      AND cm.status = 'active'
    LIMIT 1
    `,
    [userId]
  );
  if (!result?.rows?.length) return null;
  return result.rows[0];
};

/**
 * Attach company_id / company_role / recruiter_id onto auth user payload for JWT.
 */
const attachCompanyClaims = async (db, userData) => {
  if (!userData || userData.role_id !== 2) return userData;
  const membership = await loadCompanyMembership(db, userData.id);
  if (!membership) {
    userData.company_id = null;
    userData.company_role = null;
    return userData;
  }
  userData.company_id = membership.company_id;
  userData.company_role = membership.company_role;
  if (membership.recruiter_id) {
    userData.recruiter_id = membership.recruiter_id;
  }
  userData.company_verification_status = membership.verification_status;
  userData.company_is_verified = membership.is_verified;
  userData.company_is_vip = membership.is_vip;
  return userData;
};

module.exports = {
  ROLE_RANK,
  canEditCompany,
  canManageTeam,
  canManageBilling,
  canManageVerification,
  canUseJobs,
  canAssignRole,
  loadCompanyMembership,
  attachCompanyClaims,
};
