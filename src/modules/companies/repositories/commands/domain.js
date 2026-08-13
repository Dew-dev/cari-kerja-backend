const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
} = require("../../../../helpers/errors");
const { isDisposableEmail } = require("../../../../helpers/fraud/disposable_email");
const { addEmailJob } = require("../../../../helpers/queues/email.queue");
const companyInviteEmail = require("../../../../helpers/utils/companyInviteEmail");
const {
  canAssignRole,
  canEditCompany,
  canManageTeam,
} = require("../../../../helpers/auth/company_permissions");
const { buildRecruiterGraceFields } = require("../../../../helpers/fraud/employer_verification_settings");
const Command = require("./command");
const Query = require("../queries/query");

const ctx = "Companies-Command-Domain";
const INVITE_TTL_DAYS = 7;

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

class Domain {
  constructor(db) {
    this.db = db;
    this.command = new Command(db);
    this.query = new Query(db);
  }

  _requireCompanyContext(userMeta) {
    if (!userMeta?.company_id || !userMeta?.company_role) {
      return wrapper.error(
        new ForbiddenError("Company membership required. Please re-login.")
      );
    }
    return null;
  }

  async updateMyCompany(payload, userMeta) {
    const ctxErr = this._requireCompanyContext(userMeta);
    if (ctxErr) return ctxErr;
    if (!canEditCompany(userMeta.company_role) && userMeta.role_id !== 3) {
      return wrapper.error(new ForbiddenError("Only owner/admin can edit company settings"));
    }

    const updatable = [
      "company_name",
      "avatar_url",
      "company_website",
      "address",
      "industry_id",
      "description",
      "employee_count",
      "instagram_url",
      "tiktok_url",
    ];
    const document = { updated_at: new Date() };
    for (const key of updatable) {
      if (payload[key] !== undefined) document[key] = payload[key] === "" ? null : payload[key];
    }

    const result = await this.command.updateCompany(userMeta.company_id, document);
    if (result.err) {
      logger.error(ctx, "updateMyCompany", result.err);
      return wrapper.error(new InternalServerError("Failed to update company"));
    }

    // Keep legacy recruiter.company_* in sync for old public endpoints (owner row only optional)
    if (userMeta.recruiter_id && document.company_name) {
      await this.command.updateRecruiter(userMeta.recruiter_id, {
        company_name: document.company_name,
        company_website: document.company_website,
        address: document.address,
        industry_id: document.industry_id,
        description: document.description,
        employee_count: document.employee_count,
        instagram_url: document.instagram_url,
        tiktok_url: document.tiktok_url,
        avatar_url: document.avatar_url,
        updated_at: new Date(),
      });
    }

    return wrapper.data(result.data);
  }

  async updatePersonalProfile(payload, userMeta) {
    if (!userMeta?.recruiter_id) {
      return wrapper.error(new ForbiddenError("Recruiter profile required"));
    }
    const document = { updated_at: new Date() };
    for (const key of ["contact_name", "contact_phone", "avatar_url"]) {
      if (payload[key] !== undefined) document[key] = payload[key] === "" ? null : payload[key];
    }
    const result = await this.command.updateRecruiter(userMeta.recruiter_id, document);
    if (result.err) {
      return wrapper.error(new InternalServerError("Failed to update profile"));
    }
    return wrapper.data(result.data);
  }

  async updateMemberRole(payload, userMeta) {
    const ctxErr = this._requireCompanyContext(userMeta);
    if (ctxErr) return ctxErr;
    if (!canManageTeam(userMeta.company_role)) {
      return wrapper.error(new ForbiddenError("Only owner/admin can change member roles"));
    }
    if (!canAssignRole(userMeta.company_role, payload.role)) {
      return wrapper.error(new ForbiddenError("Cannot assign a role above your own"));
    }
    if (payload.userId === userMeta.id || payload.userId === userMeta.user_id) {
      return wrapper.error(new BadRequestError("Cannot change your own role"));
    }

    const memberRes = await this.query.findMember({
      companyId: userMeta.company_id,
      userId: payload.userId,
    });
    const member = memberRes?.rows?.[0];
    if (!member || member.status !== "active") {
      return wrapper.error(new NotFoundError("Member not found"));
    }
    if (member.role === "owner") {
      return wrapper.error(new ForbiddenError("Use transfer ownership to change the owner"));
    }

    const result = await this.command.updateMember(member.id, {
      role: payload.role,
      updated_at: new Date(),
    });
    if (result.err) {
      return wrapper.error(new InternalServerError("Failed to update member role"));
    }
    return wrapper.data(result.data);
  }

  async removeMember(payload, userMeta) {
    const ctxErr = this._requireCompanyContext(userMeta);
    if (ctxErr) return ctxErr;
    if (!canManageTeam(userMeta.company_role)) {
      return wrapper.error(new ForbiddenError("Only owner/admin can remove members"));
    }

    const targetUserId = payload.userId;
    if (targetUserId === userMeta.id || targetUserId === userMeta.user_id) {
      return wrapper.error(new BadRequestError("Use leave company to remove yourself"));
    }

    const memberRes = await this.query.findMember({
      companyId: userMeta.company_id,
      userId: targetUserId,
    });
    const member = memberRes?.rows?.[0];
    if (!member || member.status !== "active") {
      return wrapper.error(new NotFoundError("Member not found"));
    }
    if (member.role === "owner") {
      return wrapper.error(new ForbiddenError("Cannot remove the owner"));
    }
    if (member.role === "admin" && userMeta.company_role !== "owner") {
      return wrapper.error(new ForbiddenError("Only owner can remove an admin"));
    }

    const result = await this.command.updateMember(member.id, {
      status: "inactive",
      updated_at: new Date(),
    });
    if (result.err) {
      return wrapper.error(new InternalServerError("Failed to remove member"));
    }
    return wrapper.data({ id: member.id, status: "inactive" });
  }

  async leaveCompany(userMeta) {
    const ctxErr = this._requireCompanyContext(userMeta);
    if (ctxErr) return ctxErr;
    if (userMeta.company_role === "owner") {
      return wrapper.error(
        new BadRequestError("Owner must transfer ownership before leaving the company")
      );
    }

    const memberRes = await this.query.findMember({
      companyId: userMeta.company_id,
      userId: userMeta.id,
    });
    const member = memberRes?.rows?.[0];
    if (!member) {
      return wrapper.error(new NotFoundError("Membership not found"));
    }

    const result = await this.command.updateMember(member.id, {
      status: "inactive",
      updated_at: new Date(),
    });
    if (result.err) {
      return wrapper.error(new InternalServerError("Failed to leave company"));
    }
    return wrapper.data({ left: true });
  }

  async transferOwnership(payload, userMeta) {
    const ctxErr = this._requireCompanyContext(userMeta);
    if (ctxErr) return ctxErr;
    if (userMeta.company_role !== "owner") {
      return wrapper.error(new ForbiddenError("Only owner can transfer ownership"));
    }

    const newOwnerId = payload.new_owner_user_id;
    if (newOwnerId === userMeta.id) {
      return wrapper.error(new BadRequestError("Already the owner"));
    }

    const targetRes = await this.query.findMember({
      companyId: userMeta.company_id,
      userId: newOwnerId,
    });
    const target = targetRes?.rows?.[0];
    if (!target || target.status !== "active") {
      return wrapper.error(new NotFoundError("Target member not found"));
    }

    const currentRes = await this.query.findMember({
      companyId: userMeta.company_id,
      userId: userMeta.id,
    });
    const current = currentRes?.rows?.[0];
    if (!current) {
      return wrapper.error(new NotFoundError("Current owner membership not found"));
    }

    // Demote current owner first to satisfy unique owner index, then promote
    const demote = await this.command.updateMember(current.id, {
      role: "admin",
      updated_at: new Date(),
    });
    if (demote.err) {
      return wrapper.error(new InternalServerError("Failed to demote current owner"));
    }
    const promote = await this.command.updateMember(target.id, {
      role: "owner",
      updated_at: new Date(),
    });
    if (promote.err) {
      await this.command.updateMember(current.id, { role: "owner", updated_at: new Date() });
      return wrapper.error(new InternalServerError("Failed to transfer ownership"));
    }

    return wrapper.data({
      previous_owner_user_id: userMeta.id,
      new_owner_user_id: newOwnerId,
    });
  }

  async createInvitation(payload, userMeta) {
    const ctxErr = this._requireCompanyContext(userMeta);
    if (ctxErr) return ctxErr;
    if (!canManageTeam(userMeta.company_role)) {
      return wrapper.error(new ForbiddenError("Only owner/admin can invite members"));
    }
    if (!canAssignRole(userMeta.company_role, payload.role)) {
      return wrapper.error(new ForbiddenError("Cannot invite a role above your own"));
    }
    if (isDisposableEmail(payload.email)) {
      return wrapper.error(
        new BadRequestError("CONTENT_REJECTED: Disposable email addresses are not allowed")
      );
    }

    const email = String(payload.email).trim().toLowerCase();
    const existingUser = await this.query.findUserByEmail(email);
    if (existingUser?.rows?.[0]) {
      const u = existingUser.rows[0];
      if (u.role_id === 1) {
        return wrapper.error(
          new ConflictError("This email belongs to a job seeker account and cannot join a company")
        );
      }
      const existingMember = await this.query.findMember({
        companyId: userMeta.company_id,
        userId: u.id,
      });
      if (existingMember?.rows?.[0]?.status === "active") {
        return wrapper.error(new ConflictError("User is already a member of this company"));
      }
      // v1: one active company per user
      const otherMembership = await this.db.executeQuery(
        `
        SELECT id FROM company_members
        WHERE user_id = $1 AND status = 'active' AND company_id <> $2
        LIMIT 1
        `,
        [u.id, userMeta.company_id]
      );
      if (otherMembership?.rows?.length) {
        return wrapper.error(
          new ConflictError("User already belongs to another company")
        );
      }
    }

    const seatsRes = await this.query.getActivePlanMaxSeats(userMeta.company_id);
    const maxSeats = seatsRes?.rows?.[0]?.max_seats ?? 1;
    const countRes = await this.query.countActiveMembers(userMeta.company_id);
    const pendingRes = await this.db.executeQuery(
      `
      SELECT COUNT(*)::int AS total FROM company_invitations
      WHERE company_id = $1 AND status = 'pending' AND expires_at > NOW()
      `,
      [userMeta.company_id]
    );
    const activeCount = countRes?.rows?.[0]?.total || 0;
    const pendingCount = pendingRes?.rows?.[0]?.total || 0;
    if (activeCount + pendingCount >= maxSeats) {
      return wrapper.error(
        new ForbiddenError(
          `Seat limit reached (${maxSeats}). Upgrade the company plan to invite more members.`
        )
      );
    }

    await this.command.revokePendingInvites(userMeta.company_id, email);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

    const invite = await this.command.insertInvitation({
      id: uuidv4(),
      company_id: userMeta.company_id,
      email,
      role: payload.role || "recruiter",
      token_hash: tokenHash,
      invited_by: userMeta.id,
      status: "pending",
      expires_at: expiresAt,
    });
    if (invite.err) {
      logger.error(ctx, "createInvitation", invite.err);
      return wrapper.error(new InternalServerError("Failed to create invitation"));
    }

    const companyRes = await this.query.findCompanyById(userMeta.company_id);
    const companyName = companyRes?.rows?.[0]?.company_name || "Company";
    const frontendUrl = process.env.FRONTEND_URL || process.env.FE_URL || "";
    const inviteUrl = `${frontendUrl}/invite/accept?token=${rawToken}`;

    try {
      await addEmailJob({
        to: email,
        subject: `Undangan bergabung ke ${companyName}`,
        html: companyInviteEmail({
          inviterName: userMeta.name || userMeta.contact_name,
          companyName,
          role: payload.role || "recruiter",
          inviteUrl,
          expiresInDays: INVITE_TTL_DAYS,
        }),
      });
    } catch (e) {
      logger.error(ctx, "createInvitation email", e);
    }

    return wrapper.data({
      id: invite.data.id,
      email,
      role: payload.role || "recruiter",
      expires_at: expiresAt,
      status: "pending",
    });
  }

  async resendInvitation(payload, userMeta) {
    const ctxErr = this._requireCompanyContext(userMeta);
    if (ctxErr) return ctxErr;
    if (!canManageTeam(userMeta.company_role)) {
      return wrapper.error(new ForbiddenError("Only owner/admin can resend invitations"));
    }

    const inviteRes = await this.db.executeQuery(
      `SELECT * FROM company_invitations WHERE id = $1 AND company_id = $2 LIMIT 1`,
      [payload.id, userMeta.company_id]
    );
    const invite = inviteRes?.rows?.[0];
    if (!invite || invite.status !== "pending") {
      return wrapper.error(new NotFoundError("Pending invitation not found"));
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

    const updated = await this.command.updateInvitation(invite.id, {
      token_hash: tokenHash,
      expires_at: expiresAt,
      updated_at: new Date(),
    });
    if (updated.err) {
      return wrapper.error(new InternalServerError("Failed to resend invitation"));
    }

    const companyRes = await this.query.findCompanyById(userMeta.company_id);
    const companyName = companyRes?.rows?.[0]?.company_name || "Company";
    const frontendUrl = process.env.FRONTEND_URL || process.env.FE_URL || "";
    const inviteUrl = `${frontendUrl}/invite/accept?token=${rawToken}`;

    try {
      await addEmailJob({
        to: invite.email,
        subject: `Undangan bergabung ke ${companyName}`,
        html: companyInviteEmail({
          inviterName: userMeta.name || userMeta.contact_name,
          companyName,
          role: invite.role,
          inviteUrl,
          expiresInDays: INVITE_TTL_DAYS,
        }),
      });
    } catch (e) {
      logger.error(ctx, "resendInvitation email", e);
    }

    return wrapper.data({ id: invite.id, expires_at: expiresAt, status: "pending" });
  }

  async revokeInvitation(payload, userMeta) {
    const ctxErr = this._requireCompanyContext(userMeta);
    if (ctxErr) return ctxErr;
    if (!canManageTeam(userMeta.company_role)) {
      return wrapper.error(new ForbiddenError("Only owner/admin can revoke invitations"));
    }

    const inviteRes = await this.db.executeQuery(
      `SELECT * FROM company_invitations WHERE id = $1 AND company_id = $2 LIMIT 1`,
      [payload.id, userMeta.company_id]
    );
    const invite = inviteRes?.rows?.[0];
    if (!invite || invite.status !== "pending") {
      return wrapper.error(new NotFoundError("Pending invitation not found"));
    }

    const updated = await this.command.updateInvitation(invite.id, {
      status: "revoked",
      updated_at: new Date(),
    });
    if (updated.err) {
      return wrapper.error(new InternalServerError("Failed to revoke invitation"));
    }
    return wrapper.data({ id: invite.id, status: "revoked" });
  }

  async previewInvitation({ token }) {
    const tokenHash = hashToken(token);
    const result = await this.query.findPendingInviteByTokenHash(tokenHash);
    const invite = result?.rows?.[0];
    if (!invite) {
      return wrapper.error(new NotFoundError("Invitation not found or already used"));
    }
    if (new Date(invite.expires_at) < new Date()) {
      await this.command.updateInvitation(invite.id, {
        status: "expired",
        updated_at: new Date(),
      });
      return wrapper.error(new BadRequestError("Invitation has expired"));
    }
    return wrapper.data({
      email: invite.email,
      role: invite.role,
      company_id: invite.company_id,
      company_name: invite.company_name,
      company_avatar_url: invite.company_avatar_url,
      expires_at: invite.expires_at,
    });
  }

  async acceptInvitation({ token }, userMeta) {
    if (!userMeta?.id) {
      return wrapper.error(new ForbiddenError("Login required to accept invitation"));
    }
    if (userMeta.role_id !== 2 && userMeta.role_id !== 3) {
      return wrapper.error(new ForbiddenError("Only recruiter accounts can accept company invites"));
    }

    const tokenHash = hashToken(token);
    const result = await this.query.findPendingInviteByTokenHash(tokenHash);
    const invite = result?.rows?.[0];
    if (!invite) {
      return wrapper.error(new NotFoundError("Invitation not found or already used"));
    }
    if (new Date(invite.expires_at) < new Date()) {
      await this.command.updateInvitation(invite.id, {
        status: "expired",
        updated_at: new Date(),
      });
      return wrapper.error(new BadRequestError("Invitation has expired"));
    }

    const userEmail = String(userMeta.email || "").toLowerCase();
    if (userEmail !== String(invite.email).toLowerCase()) {
      return wrapper.error(
        new ForbiddenError("Logged-in email does not match the invitation email")
      );
    }

    const other = await this.db.executeQuery(
      `
      SELECT id FROM company_members
      WHERE user_id = $1 AND status = 'active'
      LIMIT 1
      `,
      [userMeta.id]
    );
    if (other?.rows?.length) {
      return wrapper.error(new ConflictError("You already belong to a company"));
    }

    // Ensure recruiter profile exists for this company
    let recruiterId = userMeta.recruiter_id;
    if (!recruiterId) {
      const existingRecruiter = await this.db.executeQuery(
        `SELECT id FROM recruiters WHERE user_id = $1 LIMIT 1`,
        [userMeta.id]
      );
      if (existingRecruiter?.rows?.[0]) {
        recruiterId = existingRecruiter.rows[0].id;
        await this.command.updateRecruiter(recruiterId, {
          company_id: invite.company_id,
          updated_at: new Date(),
        });
      } else {
        const grace = await buildRecruiterGraceFields();
        const created = await this.command.insertRecruiter({
          id: uuidv4(),
          user_id: userMeta.id,
          company_id: invite.company_id,
          company_name: invite.company_name || "Company",
          contact_name: userMeta.name || userMeta.username || "Recruiter",
          contact_phone: "NULL",
          ...grace,
        });
        if (created.err) {
          return wrapper.error(new InternalServerError("Failed to create recruiter profile"));
        }
        recruiterId = created.data.id;
      }
    } else {
      await this.command.updateRecruiter(recruiterId, {
        company_id: invite.company_id,
        updated_at: new Date(),
      });
    }

    const member = await this.command.insertMember({
      id: uuidv4(),
      company_id: invite.company_id,
      user_id: userMeta.id,
      role: invite.role,
      status: "active",
      invited_by: invite.invited_by,
      joined_at: new Date(),
    });
    if (member.err) {
      return wrapper.error(new InternalServerError("Failed to join company"));
    }

    await this.command.updateInvitation(invite.id, {
      status: "accepted",
      accepted_at: new Date(),
      accepted_user_id: userMeta.id,
      updated_at: new Date(),
    });

    return wrapper.data({
      company_id: invite.company_id,
      company_role: invite.role,
      recruiter_id: recruiterId,
      membership_id: member.data.id,
    });
  }

  /**
   * Used by registerRecruiter when invite_token is present.
   */
  async consumeInviteForNewUser({ token, userId, contactName, contactPhone }) {
    const tokenHash = hashToken(token);
    const result = await this.query.findPendingInviteByTokenHash(tokenHash);
    const invite = result?.rows?.[0];
    if (!invite) {
      return wrapper.error(new NotFoundError("Invitation not found or already used"));
    }
    if (new Date(invite.expires_at) < new Date()) {
      await this.command.updateInvitation(invite.id, {
        status: "expired",
        updated_at: new Date(),
      });
      return wrapper.error(new BadRequestError("Invitation has expired"));
    }

    const grace = await buildRecruiterGraceFields();
    const recruiter = await this.command.insertRecruiter({
      id: uuidv4(),
      user_id: userId,
      company_id: invite.company_id,
      company_name: invite.company_name || "Company",
      contact_name: contactName,
      contact_phone: contactPhone,
      ...grace,
    });
    if (recruiter.err) {
      return wrapper.error(new InternalServerError("Failed to create recruiter profile"));
    }

    const member = await this.command.insertMember({
      id: uuidv4(),
      company_id: invite.company_id,
      user_id: userId,
      role: invite.role,
      status: "active",
      invited_by: invite.invited_by,
      joined_at: new Date(),
    });
    if (member.err) {
      return wrapper.error(new InternalServerError("Failed to create membership"));
    }

    await this.command.updateInvitation(invite.id, {
      status: "accepted",
      accepted_at: new Date(),
      accepted_user_id: userId,
      updated_at: new Date(),
    });

    return wrapper.data({
      company_id: invite.company_id,
      company_role: invite.role,
      recruiter_id: recruiter.data.id,
      invite_email: invite.email,
    });
  }

  /**
   * Create company + owner membership for a brand-new recruiter registration.
   */
  async provisionOwnerCompany({
    userId,
    companyName,
    contactName,
    contactPhone,
    recruiterId,
  }) {
    const grace = await buildRecruiterGraceFields();
    const company = await this.command.insertCompany({
      id: uuidv4(),
      company_name: companyName,
      ...grace,
    });
    if (company.err) {
      return wrapper.error(new InternalServerError("Failed to create company"));
    }

    const member = await this.command.insertMember({
      id: uuidv4(),
      company_id: company.data.id,
      user_id: userId,
      role: "owner",
      status: "active",
      joined_at: new Date(),
    });
    if (member.err) {
      return wrapper.error(new InternalServerError("Failed to create company membership"));
    }

    // Link recruiter row if already inserted without company_id
    if (recruiterId) {
      await this.command.updateRecruiter(recruiterId, {
        company_id: company.data.id,
        updated_at: new Date(),
      });
    }

    return wrapper.data({
      company_id: company.data.id,
      company_role: "owner",
      verification_status: grace.verification_status,
      verification_deadline_at: grace.verification_deadline_at,
    });
  }
}

module.exports = Domain;
