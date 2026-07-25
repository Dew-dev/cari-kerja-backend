/**
 * Unit tests for the GPT-5 mini CV parsing path.
 *
 * The OpenAI Responses adapter is fully mocked (no real API calls). PDF page
 * rendering is mocked so no Python/render binaries are required.
 */

"use strict";

jest.mock("../../../src/modules/cv-parsing/providers/openai_responses_adapter", () => ({
  isCvParserEnabled: jest.fn(() => true),
  createCvExtraction: jest.fn(),
}));

jest.mock("../../../src/modules/cv-parsing/services/cv_ocr", () => {
  const actual = jest.requireActual("../../../src/modules/cv-parsing/services/cv_ocr");
  return { ...actual, renderPdfPagesToPng: jest.fn() };
});

const adapter = require("../../../src/modules/cv-parsing/providers/openai_responses_adapter");
const ocr = require("../../../src/modules/cv-parsing/services/cv_ocr");
const { parseWithGpt5Mini } = require("../../../src/modules/cv-parsing/services/cv_gpt_parser");

const RICH_TEXT = [
  "Jane Doe",
  "jane.doe@example.com | +6281234567890 | Jakarta",
  "Professional summary: senior backend engineer with 6 years of experience.",
  "WORK EXPERIENCE",
  "Senior Backend Engineer - Acme Corp (2020 - present)",
  "Built scalable APIs and led a team of five engineers.",
  "EDUCATION",
  "Universitas Indonesia - S1 Teknik Informatika (2012 - 2016)",
  "SKILLS",
  "Node.js, PostgreSQL, Docker, Kubernetes",
].join("\n");

function goodExtraction(overrides = {}) {
  return Object.assign(
    {
      parsed: {
        personal_info: {
          full_name: "Jane Doe",
          email: "jane.doe@example.com",
          phone: "+6281234567890",
          location: "Jakarta",
          summary: "Senior backend engineer.",
        },
        work_experiences: [
          {
            company_name: "Acme Corp",
            job_title: "Senior Backend Engineer",
            start_date: "2020-01",
            end_date: null,
            is_current: true,
            description: "Built scalable APIs.",
          },
        ],
        educations: [
          {
            institution_name: "Universitas Indonesia",
            degree: "S1",
            major: "Teknik Informatika",
            start_date: "2012-01",
            end_date: "2016-01",
            is_current: false,
            description: null,
          },
        ],
        skills: ["Node.js", "PostgreSQL", "Docker"],
      },
      usage: {
        input_tokens: 1000,
        output_tokens: 500,
        total_tokens: 1500,
        cached_tokens: 0,
        reasoning_tokens: 0,
      },
      cost: {
        currency: "USD",
        input_usd: 0.00025,
        cached_input_usd: 0,
        output_usd: 0.001,
        total_usd: 0.00125,
        model: "gpt-5-mini-2025-08-07",
        pricing_version: "gpt-5-mini-2025-08-07@0.25/2.00",
      },
      model: "gpt-5-mini-2025-08-07",
      attempts: 1,
    },
    overrides
  );
}

describe("cv_gpt_parser.parseWithGpt5Mini", () => {
  beforeEach(() => {
    adapter.isCvParserEnabled.mockReturnValue(true);
    adapter.createCvExtraction.mockReset();
    ocr.renderPdfPagesToPng.mockReset();

    process.env.OPENAI_API_KEY = "test-key-not-real";
    process.env.CV_PARSER_MIN_TEXT_CHARS = "50";
    delete process.env.CV_PDF_RENDER_MAX_PAGES;
  });

  test("rich digital PDF text → text mode, does not render page images", async () => {
    adapter.createCvExtraction.mockResolvedValueOnce(goodExtraction());

    const result = await parseWithGpt5Mini({
      filePath: "cv.pdf",
      mimetype: "application/pdf",
      digitalText: RICH_TEXT,
      extractionMethod: "digital",
    });

    expect(ocr.renderPdfPagesToPng).not.toHaveBeenCalled();
    expect(adapter.createCvExtraction).toHaveBeenCalledTimes(1);

    const args = adapter.createCvExtraction.mock.calls[0][0];
    expect(args.images).toBeUndefined();
    expect(args.userContent[0].type).toBe("input_text");
    expect(args.userContent[0].text).toContain("<CV_DOCUMENT_TEXT>");

    expect(result._meta.input_mode).toBe("text");
    expect(result._meta.extraction_method).toBe("digital");
  });

  test("thin PDF text → renders pages and sends images to the adapter", async () => {
    const png = Buffer.from("fake-png-bytes");
    ocr.renderPdfPagesToPng.mockResolvedValueOnce([png, png]);
    adapter.createCvExtraction.mockResolvedValueOnce(goodExtraction());

    const result = await parseWithGpt5Mini({
      filePath: "scan.pdf",
      mimetype: "application/pdf",
      digitalText: "tiny",
      extractionMethod: "digital",
    });

    expect(ocr.renderPdfPagesToPng).toHaveBeenCalledTimes(1);

    const args = adapter.createCvExtraction.mock.calls[0][0];
    expect(Array.isArray(args.images)).toBe(true);
    expect(args.images).toHaveLength(2);

    expect(result._meta.input_mode).toBe("image");
    expect(result._meta.extraction_method).toBe("pdf_page_images");
  });

  test("successful parse surfaces _meta.cost.total_usd", async () => {
    adapter.createCvExtraction.mockResolvedValueOnce(goodExtraction());

    const result = await parseWithGpt5Mini({
      filePath: "cv.pdf",
      mimetype: "application/pdf",
      digitalText: RICH_TEXT,
      extractionMethod: "digital",
    });

    expect(result._meta.cost).toBeDefined();
    expect(result._meta.cost.total_usd).toBeCloseTo(0.00125, 10);
    expect(result._meta.parser).toBe("gpt-5-mini");
    expect(result._meta.model).toBe("gpt-5-mini-2025-08-07");
    expect(result._meta.prompt_id).toBe("cv-extraction");
    expect(result._meta.attempts).toBe(1);
    expect(result._meta.usage.input_tokens).toBe(1000);
  });

  test("thin PDF with zero rendered pages → CV_NO_CONTENT", async () => {
    ocr.renderPdfPagesToPng.mockResolvedValueOnce([]);

    await expect(
      parseWithGpt5Mini({
        filePath: "scan.pdf",
        mimetype: "application/pdf",
        digitalText: "",
        extractionMethod: "digital",
      })
    ).rejects.toMatchObject({ code: "CV_NO_CONTENT" });

    expect(adapter.createCvExtraction).not.toHaveBeenCalled();
  });

  test("disabled parser (no API key) → CV_PARSER_DISABLED", async () => {
    adapter.isCvParserEnabled.mockReturnValue(false);

    await expect(
      parseWithGpt5Mini({
        filePath: "cv.pdf",
        mimetype: "application/pdf",
        digitalText: RICH_TEXT,
        extractionMethod: "digital",
      })
    ).rejects.toMatchObject({ code: "CV_PARSER_DISABLED" });
  });

  test("thin normalized result triggers quality gate (CV_PARSED_THIN)", async () => {
    adapter.createCvExtraction.mockResolvedValueOnce(
      goodExtraction({
        parsed: {
          personal_info: {
            full_name: null,
            email: null,
            phone: null,
            location: null,
            summary: null,
          },
          work_experiences: [],
          educations: [],
          skills: [],
        },
      })
    );

    await expect(
      parseWithGpt5Mini({
        filePath: "cv.pdf",
        mimetype: "application/pdf",
        digitalText: RICH_TEXT,
        extractionMethod: "digital",
      })
    ).rejects.toMatchObject({ code: "CV_PARSED_THIN" });
  });
});
