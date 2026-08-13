const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

module.exports = {
  getMyCompany: (userMeta) => domain.getMyCompany(userMeta),
  getCompanyById: (payload) => domain.getCompanyById(payload),
  listCompanies: (payload) => domain.listCompanies(payload),
  listMembers: (userMeta) => domain.listMembers(userMeta),
  listInvitations: (userMeta) => domain.listInvitations(userMeta),
  getMyRecruiterProfile: (userMeta) => domain.getMyRecruiterProfile(userMeta),
};
