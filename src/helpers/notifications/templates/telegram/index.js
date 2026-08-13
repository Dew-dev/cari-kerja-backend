const { renderJobAlertTelegram } = require("./jobAlert");
const { renderBulkCommunicationTelegram } = require("./bulkCommunication");
const { renderApplicationStatusTelegram } = require("./applicationStatus");
const { renderInterviewInvitationTelegram } = require("./interviewInvitation");
const { renderCompanyMessageTelegram } = require("./companyMessage");

const TELEGRAM_TEMPLATES = {
  job_alert: renderJobAlertTelegram,
  bulk_communication: renderBulkCommunicationTelegram,
  company_message: renderCompanyMessageTelegram,
  application_status: renderApplicationStatusTelegram,
  interview_invitation: renderInterviewInvitationTelegram,
};

const renderTelegramTemplate = (type, data) => {
  const renderer = TELEGRAM_TEMPLATES[type] || TELEGRAM_TEMPLATES.application_status;
  return renderer(data);
};

module.exports = {
  TELEGRAM_TEMPLATES,
  renderTelegramTemplate,
};
