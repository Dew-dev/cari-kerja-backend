/**
 * parseCV routing tests (Phase 2).
 *
 * The GPT path module is mocked so we can assert parseCV's fallback behavior
 * without touching the network or Python. parseWithNlpFallback runs for real.
 */

"use strict";

jest.mock("../../../src/modules/cv-parsing/services/cv_gpt_parser", () => ({
  parseWithGpt5Mini: jest.fn(),
  extractDigitalCvText: jest.fn(),
}));

const gpt = require("../../../src/modules/cv-parsing/services/cv_gpt_parser");
const { parseCV } = require("../../../src/modules/cv-parsing/services/cv_parser");

const RICH_TEXT = [
  "Jane Doe",
  "jane.doe@example.com | +6281234567890 | Jakarta",
  "WORK EXPERIENCE",
  "Senior Backend Engineer - Acme Corp (2020 - present)",
  "Built scalable APIs and led a team of five engineers.",
  "EDUCATION",
  "Universitas Indonesia - S1 Teknik Informatika (2012 - 2016)",
].join("\n");

describe("parseCV GPT routing", () => {
  beforeEach(() => {
    gpt.parseWithGpt5Mini.mockReset();
    gpt.extractDigitalCvText.mockReset();
  });

  test("returns GPT result directly on success", async () => {
    const gptResult = {
      personal_info: { full_name: "Jane Doe", email: "jane.doe@example.com" },
      work_experiences: [],
      educations: [],
      skills: [],
      _meta: { parser: "gpt-5-mini", cost: { total_usd: 0.00125 } },
    };
    gpt.extractDigitalCvText.mockResolvedValue({ text: RICH_TEXT, method: "digital" });
    gpt.parseWithGpt5Mini.mockResolvedValue(gptResult);

    const result = await parseCV("cv.pdf", "application/pdf");

    expect(result).toBe(gptResult);
    expect(result._meta.cost.total_usd).toBe(0.00125);
  });

  test("falls back to NLP when GPT fails and digital text exists", async () => {
    gpt.extractDigitalCvText.mockResolvedValue({ text: RICH_TEXT, method: "digital" });
    const err = new Error("AI request failed (status 429)");
    err.code = "AI_REQUEST_FAILED";
    gpt.parseWithGpt5Mini.mockRejectedValue(err);

    const result = await parseCV("cv.pdf", "application/pdf");

    expect(result._meta.parser).toBe("nlp_fallback");
    expect(result._meta.ai_failed).toBe("AI_REQUEST_FAILED");
    expect(result._meta.extraction_method).toBe("digital");
    // NLP fallback should still extract identity from the rich text.
    expect(result.personal_info.email).toBe("jane.doe@example.com");
  });

  test("image-only PDF (no digital text) surfaces a clean no-content error", async () => {
    gpt.extractDigitalCvText.mockResolvedValue({ text: "", method: "digital" });
    const err = new Error("CV has no extractable content (empty text)");
    err.code = "CV_NO_CONTENT";
    gpt.parseWithGpt5Mini.mockRejectedValue(err);

    await expect(parseCV("scan.pdf", "application/pdf")).rejects.toThrow(
      /no extractable content|empty/i
    );
  });
});
