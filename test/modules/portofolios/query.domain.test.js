const PortofoliosQueryDomain = require("../../../src/modules/portofolios/repositories/queries/domain");
const { NotFoundError } = require("../../../src/helpers/errors");

describe("Portofolios Query Domain", () => {
  let domain;
  let mockQuery;

  beforeEach(() => {
    domain = new PortofoliosQueryDomain({});
    mockQuery = {
      getAllByWorkerId: jest.fn(),
    };
    domain.query = mockQuery;
  });

  describe("getAllPortfoliosByWorkerId", () => {
    const workerId = "550e8400-e29b-41d4-a716-446655440000";

    it("should return portofolios when found", async () => {
      const portfolios = [{ id: "pf-1", title: "My Project", link: "https://example.com" }];
      mockQuery.getAllByWorkerId.mockResolvedValue({ err: null, data: portfolios });

      const result = await domain.getAllPortfoliosByWorkerId({ worker_id: workerId });

      expect(result.err).toBeNull();
      expect(result.data).toEqual(portfolios);
      expect(mockQuery.getAllByWorkerId).toHaveBeenCalledWith(workerId);
    });

    it("should return NotFoundError when query fails", async () => {
      mockQuery.getAllByWorkerId.mockResolvedValue({ err: new Error("not found"), data: null });

      const result = await domain.getAllPortfoliosByWorkerId({ worker_id: workerId });

      expect(result.err).toBeInstanceOf(NotFoundError);
      expect(result.err.message).toBe("No portofolio found");
    });

    it("should return empty array when worker has no portfolios", async () => {
      mockQuery.getAllByWorkerId.mockResolvedValue({
        err: "Data Not Found Please Try Another Input",
        data: null,
      });

      const result = await domain.getAllPortfoliosByWorkerId({ worker_id: workerId });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
    });
  });
});
