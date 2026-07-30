const { encrypt } = require("../../../src/helpers/utils/crypto_helper");
const { formatConversation, formatMessage } = require("../../../src/modules/chat/helpers/format");

describe("chat format helpers decrypt recruiter fields", () => {
  const workerUserId = "550e8400-e29b-41d4-a716-446655440001";
  const recruiterUserId = "550e8400-e29b-41d4-a716-446655440002";

  it("formatConversation decrypts recruiter company_name and name", () => {
    const formatted = formatConversation(
      {
        id: "550e8400-e29b-41d4-a716-446655440010",
        worker_id: workerUserId,
        recruiter_id: recruiterUserId,
        worker_profile_id: "550e8400-e29b-41d4-a716-446655440011",
        recruiter_profile_id: "550e8400-e29b-41d4-a716-446655440012",
        worker_username: encrypt("andi"),
        worker_name: encrypt("Andi Worker"),
        recruiter_username: encrypt("budi.hr"),
        recruiter_name: encrypt("Budi Santoso"),
        recruiter_company: encrypt("EGI Resources"),
        status: "ACTIVE",
      },
      workerUserId
    );

    expect(formatted.recruiter.company_name).toBe("EGI Resources");
    expect(formatted.recruiter.name).toBe("Budi Santoso");
    expect(formatted.recruiter.username).toBe("budi.hr");
    expect(formatted.participant.company_name).toBe("EGI Resources");
    expect(formatted.worker.name).toBe("Andi Worker");
  });

  it("formatMessage decrypts recruiter sender company_name", () => {
    const formatted = formatMessage({
      id: "550e8400-e29b-41d4-a716-446655440020",
      conversation_id: "550e8400-e29b-41d4-a716-446655440010",
      sender_id: recruiterUserId,
      sender_role_id: 2,
      sender_recruiter_id: "550e8400-e29b-41d4-a716-446655440012",
      sender_username: encrypt("budi.hr"),
      sender_name: encrypt("Budi Santoso"),
      sender_company: encrypt("EGI Resources"),
      message: "Halo",
      type: "text",
      is_read: false,
    });

    expect(formatted.sender.company_name).toBe("EGI Resources");
    expect(formatted.sender.name).toBe("Budi Santoso");
    expect(formatted.sender.username).toBe("budi.hr");
  });
});
