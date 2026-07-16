const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

const createMockRequest = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  userMeta: {},
  ...overrides,
});

module.exports = {
  createMockResponse,
  createMockRequest,
};
