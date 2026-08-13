const wrapper = require("../../../../helpers/utils/wrapper");
const { NotFoundError, ForbiddenError } = require("../../../../helpers/errors");
const Query = require("./query");

class Domain {
  constructor(db) {
    this.query = new Query(db);
  }

  async getMyCompany(userMeta) {
    if (!userMeta?.company_id) {
      return wrapper.error(
        new ForbiddenError("Company membership required. Please re-login.")
      );
    }
    const result = await this.query.findCompanyById(userMeta.company_id);
    if (!result?.rows?.length) {
      return wrapper.error(new NotFoundError("Company not found"));
    }
    return wrapper.data({
      ...result.rows[0],
      company_role: userMeta.company_role,
    });
  }

  async getCompanyById({ id }) {
    const result = await this.query.findCompanyById(id);
    if (!result?.rows?.length) {
      return wrapper.error(new NotFoundError("Company not found"));
    }
    const row = result.rows[0];
    return wrapper.data({
      id: row.id,
      company_name: row.company_name,
      avatar_url: row.avatar_url,
      company_website: row.company_website,
      address: row.address,
      industry_id: row.industry_id,
      industry_name: row.industry_name,
      description: row.description,
      employee_count: row.employee_count,
      instagram_url: row.instagram_url,
      tiktok_url: row.tiktok_url,
      is_vip: row.is_vip,
      is_verified: row.is_verified,
      verification_status: row.verification_status,
      created_at: row.created_at,
    });
  }

  async listCompanies(payload) {
    const page = Number(payload.page) || 1;
    const limit = Number(payload.limit) || 20;
    const { list, count } = await this.query.listCompanies({
      search: payload.search || null,
      industry_id: payload.industry_id || null,
      page,
      limit,
    });
    return wrapper.paginationData(list?.rows || [], {
      page,
      limit,
      totalData: count?.rows?.[0]?.total || 0,
    });
  }

  async listMembers(userMeta) {
    if (!userMeta?.company_id) {
      return wrapper.error(
        new ForbiddenError("Company membership required. Please re-login.")
      );
    }
    const result = await this.query.listMembers(userMeta.company_id);
    return wrapper.data(result?.rows || []);
  }

  async listInvitations(userMeta) {
    if (!userMeta?.company_id) {
      return wrapper.error(
        new ForbiddenError("Company membership required. Please re-login.")
      );
    }
    const result = await this.query.listInvitations(userMeta.company_id);
    return wrapper.data(result?.rows || []);
  }

  async getMyRecruiterProfile(userMeta) {
    if (!userMeta?.recruiter_id) {
      return wrapper.error(new ForbiddenError("Recruiter profile required"));
    }
    const result = await this.query.db.executeQuery(
      `
      SELECT
        id, user_id, company_id, contact_name, contact_phone, avatar_url,
        created_at, updated_at
      FROM recruiters
      WHERE id = $1
      LIMIT 1
      `,
      [userMeta.recruiter_id]
    );
    if (!result?.rows?.length) {
      return wrapper.error(new NotFoundError("Recruiter profile not found"));
    }
    return wrapper.data(result.rows[0]);
  }
}

module.exports = Domain;
