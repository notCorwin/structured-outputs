import { SAMPLE_SCHEMA } from "../constants";
import { parseDraft7Schema } from "./schema";

describe("parseDraft7Schema", () => {
  it("accepts the bundled Draft-07 object schema", () => {
    const result = parseDraft7Schema(SAMPLE_SCHEMA);

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.schema.title).toBe("ProductReview");
      expect(result.errors).toHaveLength(0);
    }
  });

  it("reports malformed JSON with a diagnostic", () => {
    const result = parseDraft7Schema('{"type":"object",');

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/JSON|Unexpected/i);
    expect(result.diagnostics[0]?.from).toBeGreaterThanOrEqual(0);
  });

  it("rejects non-Draft-07 schemas", () => {
    const result = parseDraft7Schema(
      JSON.stringify({ $schema: "https://json-schema.org/draft/2020-12/schema" }),
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Draft-07");
  });

  it("rejects a non-object top-level type for Output.object", () => {
    const result = parseDraft7Schema(JSON.stringify({ type: "array" }));

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("object");
  });

  it("accepts schemas without an explicit type", () => {
    const result = parseDraft7Schema(
      JSON.stringify({ properties: { name: { type: "string" } } }),
    );

    expect(result.valid).toBe(true);
  });
});
