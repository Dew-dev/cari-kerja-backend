const commandModel = require("../../../src/modules/job_alerts/repositories/commands/command_model");
const queryModel = require("../../../src/modules/job_alerts/repositories/queries/query_model");
const jobAlertsEmailTemplate = require("../../../src/helpers/utils/jobAlertsEmailTemplate");

const workerId = "550e8400-e29b-41d4-a716-446655440002";
const jobId = "550e8400-e29b-41d4-a716-446655440010";

describe("Job Alerts models & template", () => {
  it("should validate update payload", () => {
    const { error } = commandModel.updateJobAlertsParamType.validate({
      worker_id: workerId,
      enabled: false,
    });
    expect(error).toBeUndefined();
  });

  it("should validate get preferences payload", () => {
    const { error } = queryModel.getJobAlertsParamType.validate({ worker_id: workerId });
    expect(error).toBeUndefined();
  });

  it("should render email with clickable job links", () => {
    process.env.FE_URL = "https://fe-stage.cari-kerja.co.id";
    const html = jobAlertsEmailTemplate({
      name: "Budi",
      jobs: [
        {
          id: jobId,
          title: "Backend Developer",
          company_name: "EGI Resources",
          location: "Jakarta",
          salary_min: 8000000,
          salary_max: 12000000,
          currency: "IDR",
        },
      ],
    });

    expect(html).toContain(`https://fe-stage.cari-kerja.co.id/jobposts/${jobId}`);
    expect(html).toContain("Backend Developer");
    expect(html).toContain("Lihat lowongan");
  });
});
