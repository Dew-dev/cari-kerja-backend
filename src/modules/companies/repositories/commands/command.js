class Command {
  constructor(db) {
    this.db = db;
  }

  async insertCompany(document) {
    return this.db.insertOne(document, "companies");
  }

  async updateCompany(id, document) {
    return this.db.updateOneNew({ id }, document, "companies");
  }

  async insertMember(document) {
    return this.db.insertOne(document, "company_members");
  }

  async updateMember(id, document) {
    return this.db.updateOneNew({ id }, document, "company_members");
  }

  async insertInvitation(document) {
    return this.db.insertOne(document, "company_invitations");
  }

  async updateInvitation(id, document) {
    return this.db.updateOneNew({ id }, document, "company_invitations");
  }

  async revokePendingInvites(companyId, email) {
    return this.db.executeQuery(
      `
      UPDATE company_invitations
      SET status = 'revoked', updated_at = NOW()
      WHERE company_id = $1
        AND lower(email) = lower($2)
        AND status = 'pending'
      `,
      [companyId, email]
    );
  }

  async insertRecruiter(document) {
    return this.db.insertOne(document, "recruiters");
  }

  async updateRecruiter(id, document) {
    return this.db.updateOneNew({ id }, document, "recruiters");
  }
}

module.exports = Command;
