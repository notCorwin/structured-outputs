import Ajv from "ajv";
import type { JsonObject, SchemaDiagnostic, SchemaParseResult } from "../types";

const ajv = new Ajv({
  allErrors: true,
  strict: false,
  validateFormats: false,
});

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clampOffset(offset: number, text: string): number {
  return Math.max(0, Math.min(offset, text.length));
}

function jsonParseErrorOffset(error: unknown): number {
  if (!(error instanceof SyntaxError)) return 0;
  const match = error.message.match(/position (\d+)/i);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function diagnostic(message: string, from = 0, to = Math.max(from + 1, from)):
  SchemaDiagnostic {
  return { message, from, to };
}

function isDraft7Schema(value: JsonObject): boolean {
  const schemaUri = value.$schema;
  return (
    schemaUri == null ||
    (typeof schemaUri === "string" && schemaUri.includes("draft-07"))
  );
}

export function parseDraft7Schema(text: string): SchemaParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch (error) {
    const offset = clampOffset(jsonParseErrorOffset(error), text);
    const message = error instanceof Error ? error.message : "Invalid JSON.";
    return {
      valid: false,
      schema: null,
      errors: [message],
      diagnostics: [diagnostic(message, offset, Math.min(text.length, offset + 1))],
    };
  }

  if (!isRecord(parsed)) {
    const message = "The root JSON value must be an object schema.";
    return {
      valid: false,
      schema: null,
      errors: [message],
      diagnostics: [diagnostic(message)],
    };
  }

  if (!isDraft7Schema(parsed)) {
    const message = "Only JSON Schema Draft-07 is supported in this playground.";
    return {
      valid: false,
      schema: null,
      errors: [message],
      diagnostics: [diagnostic(message)],
    };
  }

  if (parsed.type !== undefined && parsed.type !== "object") {
    const message =
      "The top-level schema type must be `object` for AI SDK Output.object().";
    return {
      valid: false,
      schema: null,
      errors: [message],
      diagnostics: [diagnostic(message)],
    };
  }

  try {
    ajv.compile(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON Schema.";
    return {
      valid: false,
      schema: null,
      errors: [message],
      diagnostics: [diagnostic(message)],
    };
  }

  return {
    valid: true,
    schema: parsed,
    errors: [],
    diagnostics: [],
  };
}

export function schemaTitle(schema: JsonObject): string {
  return typeof schema.title === "string" && schema.title.trim()
    ? schema.title.trim()
    : "structured_output";
}

export function schemaDescription(schema: JsonObject): string | undefined {
  return typeof schema.description === "string" && schema.description.trim()
    ? schema.description.trim()
    : undefined;
}
