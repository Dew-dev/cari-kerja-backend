const commandModel = require("../../../src/modules/communication/repositories/commands/command_model");
const queryModel = require("../../../src/modules/communication/repositories/queries/query_model");

const recruiterId = "550e8400-e29b-41d4-a716-446655440001";
const workerId = "550e8400-e29b-41d4-a716-446655440002";
const applicationId = "550e8400-e29b-41d4-a716-446655440010";

describe("Communication Command Model", () => {
  it("should validate createTemplate payload", () => {
    const { error } = commandModel.createTemplateParamType.validate({
      recruiter_id: recruiterId,
      name: "Interview",
      subject: "Hi",
      body: "Hello",
    });
    expect(error).toBeUndefined();
  });

  it("should validate bulkSend payload", () => {
    const { error } = commandModel.bulkSendParamType.validate({
      recruiter_id: recruiterId,
      subject: "Update",
      body: "Message",
      application_ids: [applicationId],
      channel: "email",
    });
    expect(error).toBeUndefined();
  });

  it("should reject empty application_ids on bulkSend", () => {
    const { error } = commandModel.bulkSendParamType.validate({
      recruiter_id: recruiterId,
      subject: "Update",
      body: "Message",
      application_ids: [],
    });
    expect(error).toBeDefined();
  });

  it("should validate worker preferences update", () => {
    const { error } = commandModel.updateWorkerPreferencesParamType.validate({
      worker_id: workerId,
      email_opt_out: true,
    });
    expect(error).toBeUndefined();
  });
});

describe("Communication Query Model", () => {
  it("should validate listCampaigns query", () => {
    const { error, value } = queryModel.listCampaignsParamType.validate({
      recruiter_id: recruiterId,
      page: "1",
      limit: "20",
    });
    expect(error).toBeUndefined();
    expect(value.page).toBe(1);
  });
});
