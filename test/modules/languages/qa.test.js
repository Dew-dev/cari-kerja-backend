/**
 * QA Bug-Hunting Tests — languages
 */
jest.mock("uuid", () => ({
  v4: jest.fn(() => "language-uuid-1234"),
}));

const LanguagesCommandDomain = require("../../../src/modules/languages/repositories/commands/domain");
const LanguagesQueryDomain = require("../../../src/modules/languages/repositories/queries/domain");
const commandModel = require("../../../src/modules/languages/repositories/commands/command_model");
const { ForbiddenError } = require("../../../src/helpers/errors");

describe("[QA] languages module", () => {
  const workerId = "550e8400-e29b-41d4-a716-446655440000";
  const otherWorkerId = "550e8400-e29b-41d4-a716-446655440099";
  const languageId = "550e8400-e29b-41d4-a716-446655440010";

  describe("Security — IDOR on update", () => {
    it("[BUG-LA-001] updateOne should verify language belongs to worker_id", async () => {
      const domain = new LanguagesCommandDomain({});
      domain.query = {
        findOne: jest.fn().mockResolvedValue({
          err: null,
          data: { id: languageId, worker_id: otherWorkerId },
        }),
      };
      domain.command = {
        updateOneNew: jest.fn().mockResolvedValue({ err: null, data: true }),
      };

      const result = await domain.updateOne({
        id: languageId,
        worker_id: workerId,
        language_name: "English",
        proficiency_level_id: 1,
      });

      expect(domain.query.findOne).toHaveBeenCalledWith(
        { id: languageId, worker_id: workerId },
        expect.any(Object)
      );
      expect(result.err).toBeInstanceOf(ForbiddenError);
      expect(domain.command.updateOneNew).not.toHaveBeenCalled();
    });
  });

  describe("Query — empty list", () => {
    it("[BUG-LA-002] getAllLanguagesByWorkerId should return empty array not NotFoundError", async () => {
      const domain = new LanguagesQueryDomain({});
      domain.query = {
        getAllByWorkerId: jest.fn().mockResolvedValue({
          err: "Data Not Found Please Try Another Input",
          data: null,
        }),
      };

      const result = await domain.getAllLanguagesByWorkerId({ worker_id: workerId });

      expect(result.err).toBeNull();
      expect(result.data).toEqual([]);
    });
  });

  describe("Validation — worker_id UUID on insert schema", () => {
    it("[BUG-LA-003] addLanguagesParamType should require UUID worker_id", () => {
      const { error } = commandModel.addLanguagesParamType.validate({
        worker_id: "not-a-uuid",
        language_name: "English",
        proficiency_level_id: 1,
      });
      expect(error).toBeDefined();
    });
  });

  describe("Validation — id UUID on update schema", () => {
    it("[BUG-LA-004] updateLanguagesParamType should require UUID id", () => {
      const { error } = commandModel.updateLanguagesParamType.validate({
        id: "not-a-uuid",
        worker_id: workerId,
        language_name: "English",
        proficiency_level_id: 1,
      });
      expect(error).toBeDefined();
    });
  });
});
