const {
  enrichWorkerSignals,
  uniqueStrings,
  buildJobBlock,
} = require("../../../src/modules/candidate_matching/services/matching_cv_gpt");
const {
  computeHybridScore,
} = require("../../../src/modules/candidate_matching/services/scorer");

describe("matching_cv_gpt helpers", () => {
  it("merges CV skills and titles into worker signals", () => {
    const enriched = enrichWorkerSignals(
      {
        skill_names: ["AWS"],
        work_experiences: [{ job_title: "Analyst" }],
        address: "",
        profile_summary: "Profile bio",
        educations: [],
      },
      {
        skipped: false,
        skills_from_cv: ["Python", "aws"],
        job_titles_from_cv: ["Security Engineer"],
        years_experience_estimate: 4,
        location_hints: ["Jakarta"],
        profile_summary: "CV summary",
      },
    );

    expect(enriched.skill_names).toEqual(["AWS", "Python"]);
    expect(enriched.work_experiences.map((e) => e.job_title)).toEqual([
      "Analyst",
      "Security Engineer",
    ]);
    expect(enriched.address).toBe("Jakarta");
    expect(enriched.total_years_override).toBe(4);
    expect(enriched.profile_summary).toContain("Profile bio");
    expect(enriched.profile_summary).toContain("CV summary");
  });

  it("passes through when CV skipped", () => {
    const enriched = enrichWorkerSignals(
      { skill_names: ["Go"], work_experiences: [], address: "Bandung" },
      { skipped: true, reason: "no_resume" },
    );
    expect(enriched.skill_names).toEqual(["Go"]);
    expect(enriched.address).toBe("Bandung");
    expect(enriched.total_years_override).toBeNull();
  });

  it("dedupes strings case-insensitively", () => {
    expect(uniqueStrings(["AWS", "aws", " Python ", ""])).toEqual(["AWS", "Python"]);
  });

  it("builds a job block with skills and title", () => {
    const block = buildJobBlock({
      title: "Cybersecurity Consultant",
      skill_names: ["SIEM", "SOC"],
      city: "Jakarta",
      description: "Need SOC experience",
    });
    expect(block).toContain("Cybersecurity Consultant");
    expect(block).toContain("SIEM");
    expect(block).toContain("Need SOC experience");
  });
});

describe("hybrid-v3 with cv_fit", () => {
  it("raises score when GPT CV fit is strong and skills overlap", () => {
    const withoutCv = computeHybridScore({
      jobEmbedding: [1, 0],
      workerEmbedding: [1, 0],
      jobSkillNames: ["SIEM", "SOC", "Python"],
      workerSkillNames: ["SIEM"],
      jobTitle: "Cybersecurity Consultant",
      workExperiences: [{ job_title: "Analyst" }],
      experienceLevelName: "Junior",
      totalYears: 2,
      expectedSalary: 15e6,
      salaryMin: 10e6,
      salaryMax: 20e6,
      jobCity: "Jakarta",
      workerAddress: "Jakarta",
      cvFitPct: null,
      weights: {
        semantic: 0.15,
        skills: 0.22,
        cv_fit: 0.2,
        position: 0.13,
        experience: 0.12,
        salary: 0.08,
        location: 0.1,
      },
    });

    const withCv = computeHybridScore({
      jobEmbedding: [1, 0],
      workerEmbedding: [1, 0],
      jobSkillNames: ["SIEM", "SOC", "Python"],
      workerSkillNames: ["SIEM", "SOC", "Python"],
      jobTitle: "Cybersecurity Consultant",
      workExperiences: [
        { job_title: "Analyst" },
        { job_title: "Cybersecurity Consultant" },
      ],
      experienceLevelName: "Junior",
      totalYears: 2,
      expectedSalary: 15e6,
      salaryMin: 10e6,
      salaryMax: 20e6,
      jobCity: "Jakarta",
      workerAddress: "Jakarta",
      cvFitPct: 88,
      weights: {
        semantic: 0.15,
        skills: 0.22,
        cv_fit: 0.2,
        position: 0.13,
        experience: 0.12,
        salary: 0.08,
        location: 0.1,
      },
    });

    expect(withCv.match_breakdown.cv_fit).toBe(88);
    expect(withCv.match_score).toBeGreaterThan(withoutCv.match_score);
  });

  it("renormalizes weights when cv_fit is absent", () => {
    const result = computeHybridScore({
      jobEmbedding: [],
      workerEmbedding: [],
      jobSkillNames: ["A"],
      workerSkillNames: ["A"],
      cvFitPct: null,
      semanticPctOverride: 0,
      weights: {
        semantic: 0.15,
        skills: 0.22,
        cv_fit: 0.2,
        position: 0.13,
        experience: 0.12,
        salary: 0.08,
        location: 0.1,
      },
    });
    expect(result.match_breakdown.cv_fit).toBeNull();
    expect(result.match_breakdown.weights.cv_fit).toBe(0);
    expect(result.match_score).toBeGreaterThan(0);
  });
});
