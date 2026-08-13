jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid-mock"),
}));

jest.mock("../../src/helpers/utils/logger", () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

jest.mock("../../src/helpers/queues/email.queue", () => ({
  addEmailJob: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../src/helpers/queues/matching.queue", () => ({
  enqueueComputeApplicationMatch: jest.fn().mockResolvedValue(undefined),
  enqueueOrComputeApplicationMatch: jest.fn().mockResolvedValue(undefined),
  enqueueRecomputeWorkerMatches: jest.fn().mockResolvedValue(undefined),
  enqueueRecomputeJobMatches: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../src/helpers/queues/telegram.queue", () => ({
  addTelegramJob: jest.fn().mockResolvedValue(undefined),
}));
