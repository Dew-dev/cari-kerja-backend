const {
  computeHybridScore,
  skillOverlapPct,
  experienceFitPct,
  educationFitPct,
  positionFitPct,
  salaryFitPct,
  locationFitPct,
  cosineSimilarity,
} = require("../../../src/modules/candidate_matching/services/scorer");

describe("Candidate Matching Scorer (hybrid-v2.2)", () => {
  const perfectVec = [1, 0, 0];
  const sameVec = [1, 0, 0];
  const orthogonalVec = [0, 1, 0];

  const fairWeights = {
    semantic: 0.15,
    skills: 0.3,
    position: 0.2,
    experience: 0.15,
    salary: 0.08,
    location: 0.12,
  };

  it("scores strong skill+role fit highly", () => {
    const result = computeHybridScore({
      jobEmbedding: perfectVec,
      workerEmbedding: sameVec,
      jobSkillNames: ["React", "Node.js", "PostgreSQL"],
      workerSkillNames: ["React", "NodeJS", "PostgreSQL"],
      experienceLevelName: "Junior",
      totalYears: 2,
      jobText: "Need S1 Computer Science",
      educations: [{ degree: "S1", major: "Computer Science" }],
      jobTitle: "Backend Engineer",
      workExperiences: [{ job_title: "Backend Developer" }],
      expectedSalary: 15000000,
      salaryMin: 10000000,
      salaryMax: 20000000,
      jobCity: "Jakarta Selatan",
      workerAddress: "Jakarta Selatan",
      weights: fairWeights,
    });

    expect(result.match_score).toBeGreaterThanOrEqual(80);
    expect(result.match_breakdown.skills).toBeGreaterThanOrEqual(90);
    expect(result.match_breakdown.position).toBeGreaterThanOrEqual(50);
  });

  it("does not inflate score when skills are weak despite mid semantic", () => {
    const result = computeHybridScore({
      jobEmbedding: perfectVec,
      workerEmbedding: sameVec,
      jobSkillNames: ["SIEM", "SOC", "Pentest", "Python", "AWS", "Kubernetes", "Go"],
      workerSkillNames: ["Microsoft Office"],
      experienceLevelName: "Junior",
      totalYears: 2,
      jobTitle: "Cybersecurity Consultant",
      workExperiences: [{ job_title: "Administrative Assistant" }],
      expectedSalary: 15000000,
      salaryMin: 10000000,
      salaryMax: 20000000,
      jobCity: "Jakarta",
      workerAddress: "Jakarta",
      skipSemantic: false,
      weights: fairWeights,
    });

    expect(result.match_breakdown.skills).toBeLessThan(20);
    expect(result.match_score).toBeLessThan(55);
  });

  it("returns low skill score for empty worker profile skills", () => {
    expect(
      skillOverlapPct({ jobSkillIds: ["a", "b", "c"], workerSkillIds: [] }),
    ).toBe(0);
  });

  it("gives partial credit for aliased skills", () => {
    expect(
      skillOverlapPct({
        jobSkillNames: ["React.js", "Node.js"],
        workerSkillNames: ["React", "NodeJS"],
      }),
    ).toBe(100);
  });

  it("maps positive cosine only (orthogonal ≈ 0, not 50)", () => {
    expect(cosineSimilarity(perfectVec, sameVec)).toBeCloseTo(1, 5);
    expect(cosineSimilarity(perfectVec, orthogonalVec)).toBeCloseTo(0, 5);
  });

  it("fits junior experience band", () => {
    expect(experienceFitPct({ experienceLevelName: "Junior", totalYears: 2 })).toBe(100);
    expect(experienceFitPct({ experienceLevelName: "Junior", totalYears: 0 })).toBeLessThan(100);
  });

  it("scores education only when job requires a degree", () => {
    expect(
      educationFitPct({
        jobText: "Friendly team, no degree required",
        educations: [{ degree: "S1 Informatika" }],
      }),
    ).toBeNull();

    expect(
      educationFitPct({
        jobText: "Requires S1 Informatics",
        educations: [{ degree: "S1 Informatika" }],
      }),
    ).toBe(100);
  });

  it("scores related security titles reasonably", () => {
    expect(
      positionFitPct({
        jobTitle: "Cybersecurity Consultant",
        workExperiences: [{ job_title: "Security Analyst" }],
      }),
    ).toBeGreaterThanOrEqual(35);
  });

  it("softens salary outside a small corridor", () => {
    expect(
      salaryFitPct({
        expectedSalary: 12000000,
        salaryMin: 10000000,
        salaryMax: 15000000,
      }),
    ).toBe(100);

    // 20% below min → still partial credit
    expect(
      salaryFitPct({
        expectedSalary: 8000000,
        salaryMin: 10000000,
        salaryMax: 15000000,
      }),
    ).toBeGreaterThanOrEqual(50);
  });

  it("scores location highly on city match alone", () => {
    expect(
      locationFitPct({
        jobCity: "Bandung",
        jobProvince: "Jawa Barat",
        workerAddress: "Jl. Asia Afrika, Bandung 40111",
      }),
    ).toBe(100);
  });

  it("drops unavailable signals instead of injecting neutral 50", () => {
    const result = computeHybridScore({
      jobEmbedding: [],
      workerEmbedding: [],
      jobSkillNames: ["Python"],
      workerSkillNames: ["Python"],
      jobTitle: "Python Developer",
      workExperiences: [{ job_title: "Python Developer" }],
      experienceLevelName: "Junior",
      totalYears: 2,
      expectedSalary: null,
      salaryMin: null,
      salaryMax: null,
      jobCity: "",
      workerAddress: "",
      skipSemantic: true,
      weights: fairWeights,
    });

    expect(result.match_breakdown.salary).toBeNull();
    expect(result.match_breakdown.location).toBeNull();
    expect(result.match_breakdown.semantic).toBeNull();
    expect(result.match_breakdown.weights.salary).toBe(0);
    expect(result.match_score).toBeGreaterThanOrEqual(80);
  });

  it("accepts semanticPctOverride from ES knn", () => {
    const result = computeHybridScore({
      jobEmbedding: perfectVec,
      workerEmbedding: orthogonalVec,
      jobSkillIds: [],
      workerSkillIds: [],
      experienceLevelName: "Junior",
      totalYears: 2,
      jobText: "",
      educations: [],
      jobTitle: "Junior Engineer",
      workExperiences: [{ job_title: "Junior Engineer" }],
      weights: {
        semantic: 1,
        skills: 0,
        position: 0,
        experience: 0,
        salary: 0,
        location: 0,
        education: 0,
      },
      semanticPctOverride: 88,
    });

    expect(result.match_breakdown.semantic).toBe(88);
    expect(result.match_score).toBe(88);
  });
});
