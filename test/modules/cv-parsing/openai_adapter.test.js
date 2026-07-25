/**
 * Unit tests for the OpenAI Responses adapter.
 * The `openai` SDK is fully mocked — no real API calls are made.
 */

"use strict";

const mockCreate = jest.fn();

jest.mock("openai", () => {
  return jest.fn().mockImplementation(function OpenAIMock(opts) {
    // Capture constructor options for assertions if needed.
    OpenAIMock.__lastOpts = opts;
    this.responses = { create: (...args) => mockCreate(...args) };
  });
});

const SCHEMA = {
  name: "cv_extraction",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: { personal_info: { type: "object" } },
  },
};

function goodResponse(overrides = {}) {
  return Object.assign(
    {
      status: "completed",
      model: "gpt-5-mini-2025-08-07",
      output_text: JSON.stringify({ personal_info: { name: "A" } }),
      output: [
        {
          type: "message",
          content: [{ type: "output_text", text: "" }],
        },
      ],
      usage: {
        input_tokens: 1000,
        output_tokens: 500,
        total_tokens: 1500,
      },
    },
    overrides
  );
}

describe("openai_responses_adapter", () => {
  let adapter;

  beforeEach(() => {
    jest.resetModules();
    jest.useRealTimers();
    mockCreate.mockReset();

    process.env.OPENAI_API_KEY = "test-key-not-real";
    process.env.CV_PARSER_MODEL = "gpt-5-mini-2025-08-07";
    process.env.CV_PARSER_REASONING_EFFORT = "low";
    process.env.CV_PARSER_MAX_OUTPUT_TOKENS = "8000";
    process.env.CV_PARSER_MAX_RETRIES = "1";

    // Re-require after mock/env reset.
    adapter = require("../../../src/modules/cv-parsing/providers/openai_responses_adapter");
  });

  test("isCvParserEnabled reflects presence of API key", () => {
    expect(adapter.isCvParserEnabled()).toBe(true);
    delete process.env.OPENAI_API_KEY;
    expect(adapter.isCvParserEnabled()).toBe(false);
  });

  test("builds a correct request body (no temperature, json_schema strict)", async () => {
    mockCreate.mockResolvedValueOnce(goodResponse());

    await adapter.createCvExtraction({
      systemPrompt: "SYS",
      userContent: [{ type: "input_text", text: "CV text" }],
      schema: SCHEMA,
    });

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const body = mockCreate.mock.calls[0][0];

    expect(body.model).toBe("gpt-5-mini-2025-08-07");
    expect(body.reasoning).toEqual({ effort: "low" });
    expect(body.max_output_tokens).toBe(8000);
    expect(body).not.toHaveProperty("temperature");
    expect(body.text.format.type).toBe("json_schema");
    expect(body.text.format.strict).toBe(true);
    expect(body.text.format.name).toBe("cv_extraction");

    expect(body.input[0]).toEqual({ role: "system", content: "SYS" });
    expect(body.input[1].role).toBe("user");
    expect(Array.isArray(body.input[1].content)).toBe(true);
  });

  test("appends input_image parts with data URL when images provided", async () => {
    mockCreate.mockResolvedValueOnce(goodResponse());

    const png = Buffer.from("fake-png-bytes");
    await adapter.createCvExtraction({
      systemPrompt: "SYS",
      userContent: [{ type: "input_text", text: "CV text" }],
      images: [png],
      schema: SCHEMA,
    });

    const body = mockCreate.mock.calls[0][0];
    const parts = body.input[1].content;
    const imgPart = parts.find((p) => p.type === "input_image");

    expect(imgPart).toBeDefined();
    expect(imgPart.detail).toBe("auto");
    expect(typeof imgPart.image_url).toBe("string");
    expect(imgPart.image_url.startsWith("data:image/png;base64,")).toBe(true);
    expect(imgPart.image_url).toBe(
      "data:image/png;base64," + png.toString("base64")
    );
  });

  test("computes cost.total_usd correctly from usage", async () => {
    mockCreate.mockResolvedValueOnce(goodResponse());

    const result = await adapter.createCvExtraction({
      systemPrompt: "SYS",
      userContent: [{ type: "input_text", text: "x" }],
      schema: SCHEMA,
    });

    // 1000 input + 500 output: 1000/1e6*0.25 + 500/1e6*2 = 0.00025 + 0.001 = 0.00125
    expect(result.cost.total_usd).toBeCloseTo(0.00125, 10);
    expect(result.cost.input_usd).toBeCloseTo(0.00025, 10);
    expect(result.cost.output_usd).toBeCloseTo(0.001, 10);
    expect(result.cost.currency).toBe("USD");
    expect(result.cost.pricing_version).toBe(adapter.PRICING_VERSION);
    expect(result.usage.input_tokens).toBe(1000);
    expect(result.usage.output_tokens).toBe(500);
    expect(result.attempts).toBe(1);
  });

  test("computes cached-token discount in cost", async () => {
    mockCreate.mockResolvedValueOnce(
      goodResponse({
        usage: {
          input_tokens: 1000,
          output_tokens: 500,
          total_tokens: 1500,
          input_tokens_details: { cached_tokens: 200 },
          output_tokens_details: { reasoning_tokens: 100 },
        },
      })
    );

    const result = await adapter.createCvExtraction({
      systemPrompt: "SYS",
      userContent: [{ type: "input_text", text: "x" }],
      schema: SCHEMA,
    });

    // billable_input = 800: 800/1e6*0.25 + 200/1e6*0.025 + 500/1e6*2
    const expected = (800 / 1e6) * 0.25 + (200 / 1e6) * 0.025 + (500 / 1e6) * 2;
    expect(result.cost.total_usd).toBeCloseTo(expected, 10);
    expect(result.usage.cached_tokens).toBe(200);
    expect(result.usage.reasoning_tokens).toBe(100);
  });

  test("retries once on 429 then succeeds (attempts = 2)", async () => {
    const err = new Error("rate limited");
    err.status = 429;
    mockCreate.mockRejectedValueOnce(err).mockResolvedValueOnce(goodResponse());

    const result = await adapter.createCvExtraction({
      systemPrompt: "SYS",
      userContent: [{ type: "input_text", text: "x" }],
      schema: SCHEMA,
    });

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(result.attempts).toBe(2);
  });

  test("does not retry on 401 (throws immediately)", async () => {
    const err = new Error("unauthorized");
    err.status = 401;
    mockCreate.mockRejectedValue(err);

    await expect(
      adapter.createCvExtraction({
        systemPrompt: "SYS",
        userContent: [{ type: "input_text", text: "x" }],
        schema: SCHEMA,
      })
    ).rejects.toMatchObject({ code: "AI_REQUEST_FAILED", attempts: 1 });

    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test("throws AI_REFUSAL without retry on refusal content", async () => {
    mockCreate.mockResolvedValue(
      goodResponse({
        output_text: "",
        output: [
          {
            type: "message",
            content: [{ type: "refusal", refusal: "no" }],
          },
        ],
      })
    );

    await expect(
      adapter.createCvExtraction({
        systemPrompt: "SYS",
        userContent: [{ type: "input_text", text: "x" }],
        schema: SCHEMA,
      })
    ).rejects.toMatchObject({ code: "AI_REFUSAL" });

    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test("throws AI_INCOMPLETE when status incomplete", async () => {
    mockCreate.mockResolvedValue(
      goodResponse({
        status: "incomplete",
        incomplete_details: { reason: "max_output_tokens" },
        output_text: "",
      })
    );

    await expect(
      adapter.createCvExtraction({
        systemPrompt: "SYS",
        userContent: [{ type: "input_text", text: "x" }],
        schema: SCHEMA,
      })
    ).rejects.toMatchObject({ code: "AI_INCOMPLETE", reason: "max_output_tokens" });
  });

  test("throws AI_INVALID_JSON after retries exhausted (invalid twice)", async () => {
    mockCreate.mockResolvedValue(goodResponse({ output_text: "not-json{" }));

    await expect(
      adapter.createCvExtraction({
        systemPrompt: "SYS",
        userContent: [{ type: "input_text", text: "x" }],
        schema: SCHEMA,
      })
    ).rejects.toMatchObject({ code: "AI_INVALID_JSON", attempts: 2 });

    // maxAttempts = 1 + 1 retry = 2 calls.
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  test("falls back to output_text parts when top-level output_text empty", async () => {
    mockCreate.mockResolvedValueOnce(
      goodResponse({
        output_text: "",
        output: [
          {
            type: "message",
            content: [
              { type: "output_text", text: '{"personal_info":' },
              { type: "output_text", text: '{"name":"B"}}' },
            ],
          },
        ],
      })
    );

    const result = await adapter.createCvExtraction({
      systemPrompt: "SYS",
      userContent: [{ type: "input_text", text: "x" }],
      schema: SCHEMA,
    });

    expect(result.parsed).toEqual({ personal_info: { name: "B" } });
  });
});
