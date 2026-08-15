import { SAMPLE_SCHEMA } from "../constants";
import { parseDraft7Schema } from "./schema";

describe("parseDraft7Schema", () => {
  it("accepts the bundled Draft-07 object schema", () => {
    const result = parseDraft7Schema(SAMPLE_SCHEMA);

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.schema.title).toBe("ProductCatalogRecord");
      expect(result.errors).toHaveLength(0);
    }
  });

  it("demonstrates every JSON Schema value type", () => {
    const result = parseDraft7Schema(SAMPLE_SCHEMA);
    expect(result.valid).toBe(true);
    if (!result.valid) return;

    const types = new Set<string>();
    const visit = (value: unknown): void => {
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (value == null || typeof value !== "object") return;

      const type = (value as { type?: unknown }).type;
      if (typeof type === "string") types.add(type);
      if (Array.isArray(type)) type.filter((item): item is string => typeof item === "string").forEach((item) => types.add(item));
      Object.values(value).forEach(visit);
    };

    visit(result.schema);
    expect(types).toEqual(new Set(["array", "boolean", "integer", "null", "number", "object", "string"]));
  });

  it("keeps the bundled example within the native structured-output subset", () => {
    const result = parseDraft7Schema(SAMPLE_SCHEMA);
    expect(result.valid).toBe(true);
    if (!result.valid) return;

    const unsupportedKeywords = new Set([
      "format",
      "maximum",
      "maxItems",
      "maxLength",
      "minimum",
      "minItems",
      "minLength",
      "multipleOf",
      "pattern",
      "uniqueItems",
    ]);
    const found: string[] = [];
    const visit = (value: unknown): void => {
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (value == null || typeof value !== "object") return;

      Object.entries(value).forEach(([key, child]) => {
        if (unsupportedKeywords.has(key)) found.push(key);
        visit(child);
      });
    };

    visit(result.schema);
    expect(found).toEqual([]);
    expect(result.schema.properties).toHaveProperty("discontinuedAt.anyOf");
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
