/**
 * QA Bug-Hunting Tests — portofolios
 */
jest.mock("uuid", () => ({
  v4: jest.fn(() => "portfolio-uuid-1234"),
}));

const PortfoliosCommandDomain = require("../../../src/modules/portofolios/repositories/commands/domain");
const PortfoliosQueryDomain = require("../../../src/modules/portofolios/repositories/queries/domain");
const commandModel = require("../../../src/modules/portofolios/repositories/commands/command_model");
const { ForbiddenError } = require("../../../src/helpers/errors");

describe("[QA] portofolios module", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";
  const otherWorkerId = "550e8400-e29b-41d4-a716-446655440099";
  const portfolioId = "550e8400-e29b-41d4-a716-446655440010";

  describe("Security — IDOR on update", () => {
    it("[BUG-PO-001] updateOne should verify portfolio belongs to worker_id", async () => {
      const domain = new PortfoliosCommandDomain({});
      domain.query = {
        findOne: jest.fn().mockResolvedValue({
          err: null,
          data: { id: portfolioId, worker_id: otherWorkerId },
        }),
      };
      domain.command = {
        updateOneNew: jest.fn().mockResolvedValue({ err: null, data: true }),
      };

      const result = await domain.updateOne({
        id: portfolioId,
        worker_id: workerId,
        title: "Hacked Portfolio",
        link: "https://example.com",
      });

      expect(domain.query.findOne).toHaveBeenCalledWith(
        { id: portfolioId, worker_id: workerId },
        expect.any(Object)
      );
      expect(result.err).toBeInstanceOf(ForbiddenError);
      expect(domain.command.updateOneNew).not.toHaveBeenCalled();
    });
  });

  describe("Query — empty list", () => {
    it("[BUG-PO-002] getAllPortfoliosByWorkerId should return empty array not NotFoundError", async () => {
      const domain = new PortfoliosQueryDomain({});
      domain.query = {
        getAllByWorkerId: jest.fn().mockResolvedValue({
          err: "Data Not Found Please Try Another Input",
          data: null,
        }),
      };

      const result = await domain.getAllPortfoliosByWorkerId({ worker_id: workerId });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
    });
  });

  describe("Validation — link URI format", () => {
    it("[BUG-PO-003] addPortfoliosParamType should validate link as URI", () => {
      const { error } = commandModel.addPortfoliosParamType.validate({
        worker_id: workerId,
        title: "My Project",
        link: "not-a-valid-url",
      });
      expect(error).toBeDefined();
    });
  });

  describe("Validation — worker_id UUID", () => {
    it("[BUG-PO-004] addPortfoliosParamType should require UUID worker_id", () => {
      const { error } = commandModel.addPortfoliosParamType.validate({
        worker_id: "not-a-uuid",
        title: "My Project",
        link: "https://example.com",
      });
      expect(error).toBeDefined();
    });
  });
});
