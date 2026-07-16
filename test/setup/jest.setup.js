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
