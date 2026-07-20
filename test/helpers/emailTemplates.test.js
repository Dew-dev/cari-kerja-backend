const verifyEmail = require("../../src/helpers/utils/verifyEmail");
const resetPasswordEmail = require("../../src/helpers/utils/resetPasswordEmail");
const statusEmailTemplate = require("../../src/helpers/utils/statusEmailTemplate");
const jobNotificationEmail = require("../../src/helpers/utils/jobNotificationEmail");

describe("email templates branding", () => {
  it("verifyEmail should render branded HTML with CTA", () => {
    const html = verifyEmail({
      name: "Egi",
      verifyUrl: "https://cari-kerja.co.id/verify-email?token=abc",
    });
    expect(html).toContain("Cari Kerja");
    expect(html).toContain("#2563eb");
    expect(html).toContain("Verifikasi Email");
    expect(html).toContain("https://cari-kerja.co.id/verify-email?token=abc");
  });

  it("resetPasswordEmail should render branded HTML", () => {
    const html = resetPasswordEmail({
      name: "Egi",
      resetUrl: "https://cari-kerja.co.id/reset?token=xyz",
    });
    expect(html).toContain("Reset kata sandi");
    expect(html).toContain("#2563eb");
  });

  it("statusEmailTemplate should handle pipeline stage names", () => {
    const html = statusEmailTemplate({
      name: "Egi",
      jobTitle: "Backend Engineer",
      status: "SHORTLISTED",
      companyName: "Dew Corp",
      actionUrl: "https://cari-kerja.co.id/applications/1",
    });
    expect(html).toContain("Update status lamaran");
    expect(html).toContain("Backend Engineer");
    expect(html).toContain("Dew Corp");
    expect(html).toContain("Lihat Detail Lamaran");
  });

  it("jobNotificationEmail should render job alert card", () => {
    const html = jobNotificationEmail({
      name: "Egi",
      jobTitle: "Frontend Developer",
      companyName: "Cari Kerja",
      location: "Jakarta",
      jobUrl: "https://cari-kerja.co.id/jobposts/1",
    });
    expect(html).toContain("Lowongan baru untuk Anda");
    expect(html).toContain("Frontend Developer");
    expect(html).toContain("Lihat Lowongan");
  });
});
