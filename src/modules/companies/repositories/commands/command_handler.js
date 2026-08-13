const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

module.exports = {
  updateMyCompany: (payload, userMeta) => domain.updateMyCompany(payload, userMeta),
  updatePersonalProfile: (payload, userMeta) =>
    domain.updatePersonalProfile(payload, userMeta),
  updateMemberRole: (payload, userMeta) => domain.updateMemberRole(payload, userMeta),
  removeMember: (payload, userMeta) => domain.removeMember(payload, userMeta),
  leaveCompany: (userMeta) => domain.leaveCompany(userMeta),
  transferOwnership: (payload, userMeta) =>
    domain.transferOwnership(payload, userMeta),
  createInvitation: (payload, userMeta) => domain.createInvitation(payload, userMeta),
  resendInvitation: (payload, userMeta) => domain.resendInvitation(payload, userMeta),
  revokeInvitation: (payload, userMeta) => domain.revokeInvitation(payload, userMeta),
  previewInvitation: (payload) => domain.previewInvitation(payload),
  acceptInvitation: (payload, userMeta) => domain.acceptInvitation(payload, userMeta),
  consumeInviteForNewUser: (payload) => domain.consumeInviteForNewUser(payload),
  provisionOwnerCompany: (payload) => domain.provisionOwnerCompany(payload),
};
