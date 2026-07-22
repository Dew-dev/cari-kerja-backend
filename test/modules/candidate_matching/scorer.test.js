const {
  computeHybridScore,
  skillOverlapPct,
  experienceFitPct,
  educationFitPct,
  cosineSimilarity,
} = require("../../../src/modules/candidate_matching/services/scorer");

describe("Candidate Matching Scorer", () => {
  const perfectVec = [1, 0, 0];
  const sameVec = [1, 0, 0];
  const orthogonalVec = [0, 1, 0];

  it("scores perfect skill overlap highly when embeddings align", () => {
    const result = computeHybridScore({
      jobEmbedding: perfectVec,
      workerEmbedding: sameVec,
      jobSkillIds: ["a", "b"],
      workerSkillIds: ["a", "b"],
      experienceLevelName: "Junior",
      totalYears: 2,
      jobText: "Need S1 Computer Science",
      educations: [{ degree: "S1", major: "Computer Science" }],
      weights: { semantic: 0.5, skills: 0.25, experience: 0.15, education: 0.1 },
    });

    expect(result.match_score).toBeGreaterThanOrEqual(85);
    expect(result.match_breakdown.skills).toBe(100);
    expect(result.match_reasons.length).toBeGreaterThan(0);
  });

  it("returns low skill score for empty worker profile skills", () => {
    expect(
      skillOverlapPct({ jobSkillIds: ["a", "b", "c"], workerSkillIds: [] }),
    ).toBe(0);
  });

  it("handles empty profile with neutral/low hybrid score", () => {
    const result = computeHybridScore({
      jobEmbedding: perfectVec,
      workerEmbedding: orthogonalVec,
      jobSkillIds: ["a", "b"],
      workerSkillIds: [],
      experienceLevelName: "Senior",
      totalYears: 0,
      jobText: "Senior engineer S1 required",
      educations: [],
      weights: { semantic: 0.5, skills: 0.25, experience: 0.15, education: 0.1 },
    });

    expect(result.match_score).toBeLessThan(50);
    expect(result.match_breakdown.skills).toBe(0);
  });

  it("maps cosine to [0,1] range", () => {
    expect(cosineSimilarity(perfectVec, sameVec)).toBeCloseTo(1, 5);
    expect(cosineSimilarity(perfectVec, orthogonalVec)).toBeCloseTo(0.5, 5);
  });

  it("fits junior experience band", () => {
    expect(experienceFitPct({ experienceLevelName: "Junior", totalYears: 2 })).toBe(100);
    expect(experienceFitPct({ experienceLevelName: "Junior", totalYears: 0 })).toBeLessThan(100);
  });

  it("rewards matching education requirement", () => {
    expect(
      educationFitPct({
        jobText: "Requires S1 Informatics",
        educations: [{ degree: "S1 Informatika" }],
      }),
    ).toBe(100);
  });
});
