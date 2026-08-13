const {
  renderTelegramTemplate,
} = require("../../src/helpers/notifications/templates/telegram");

describe("telegram templates", () => {
  it("renders job alert", () => {
    const out = renderTelegramTemplate("job_alert", {
      name: "Andi",
      jobs: [{ title: "Engineer", company: "Acme" }],
    });
    expect(out.text).toContain("Job Alert");
    expect(out.text).toContain("Engineer");
    expect(out.parseMode).toBe("HTML");
  });

  it("renders interview invitation", () => {
    const out = renderTelegramTemplate("interview_invitation", {
      name: "Budi",
      jobTitle: "Designer",
      companyName: "Studio",
    });
    expect(out.text).toContain("Undangan wawancara");
    expect(out.text).toContain("Designer");
  });

  it("renders bulk / company message", () => {
    const out = renderTelegramTemplate("bulk_communication", {
      subject: "Halo",
      body: "Pesan dari HR",
      companyName: "PT Test",
    });
    expect(out.text).toContain("Halo");
    expect(out.text).toContain("Pesan dari HR");
  });
});
