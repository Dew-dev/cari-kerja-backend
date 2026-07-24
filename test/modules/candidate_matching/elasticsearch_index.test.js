jest.mock("../../../src/helpers/databases/elasticsearch/client", () => ({
  getClient: jest.fn(),
  isEnabled: jest.fn(),
  getEsConfig: jest.fn(() => ({
    jobsIndex: "matching_jobs",
    workersIndex: "matching_workers",
    knnCandidates: 50,
  })),
}));

const {
  getClient,
  isEnabled,
} = require("../../../src/helpers/databases/elasticsearch/client");
const {
  ensureIndices,
  indexEntity,
  knnSemanticSimilarity,
  findSimilarWorkers,
} = require("../../../src/modules/candidate_matching/services/elasticsearch_index");

describe("Elasticsearch matching index", () => {
  const dims = 256;
  const embedding = Array.from({ length: dims }, (_, i) => (i === 0 ? 1 : 0));

  beforeEach(() => {
    jest.clearAllMocks();
    // reset module-level indicesReady by requiring fresh... we rely on exists=true path
  });

  it("no-ops when ES disabled", async () => {
    isEnabled.mockReturnValue(false);
    expect(await ensureIndices()).toEqual({ skipped: true, reason: "es_disabled" });
    expect(await indexEntity({ entity_type: "job", entity_id: "x", embedding })).toEqual({
      skipped: true,
      reason: "es_disabled",
    });
    expect(await knnSemanticSimilarity({ jobEmbedding: embedding, worker_id: "w" })).toBeNull();
    expect(await findSimilarWorkers({ jobEmbedding: embedding })).toEqual([]);
  });

  it("indexes entity when dims match", async () => {
    isEnabled.mockReturnValue(true);
    const index = jest.fn().mockResolvedValue({});
    const exists = jest.fn().mockResolvedValue(true);
    getClient.mockReturnValue({
      indices: { exists, create: jest.fn() },
      index,
      search: jest.fn(),
    });

    const result = await indexEntity({
      entity_type: "worker",
      entity_id: "550e8400-e29b-41d4-a716-446655440002",
      text_hash: "abc",
      model_version: "hybrid-v1",
      embedding,
      source_text: "nodejs backend",
    });

    expect(result.ok).toBe(true);
    expect(index).toHaveBeenCalled();
  });

  it("skips index on dims mismatch", async () => {
    isEnabled.mockReturnValue(true);
    getClient.mockReturnValue({
      indices: { exists: jest.fn().mockResolvedValue(true) },
      index: jest.fn(),
    });

    const result = await indexEntity({
      entity_type: "job",
      entity_id: "j1",
      text_hash: "h",
      model_version: "hybrid-v1",
      embedding: [1, 0, 0],
    });

    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("dims_mismatch");
  });

  it("returns knn similarity score when hit found", async () => {
    isEnabled.mockReturnValue(true);
    const search = jest.fn().mockResolvedValue({
      hits: { hits: [{ _score: 0.91 }] },
    });
    getClient.mockReturnValue({
      indices: { exists: jest.fn().mockResolvedValue(true) },
      search,
    });

    const score = await knnSemanticSimilarity({
      jobEmbedding: embedding,
      worker_id: "550e8400-e29b-41d4-a716-446655440002",
    });

    expect(score).toBeCloseTo(0.91, 5);
    expect(search).toHaveBeenCalled();
  });
});
