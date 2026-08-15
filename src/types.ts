export interface ConnectionSettings {
  baseUrl: string;
  model: string;
  apiKey: string;
}

export type RunStatus = "idle" | "running" | "complete" | "cancelled" | "error";

export interface PlaygroundState {
  schemaText: string;
  prompt: string;
  rawResponse: string;
  isRunning: boolean;
  error: string | null;
}

export type JsonObject = Record<string, unknown>;

export interface SchemaDiagnostic {
  message: string;
  from: number;
  to: number;
}

export type SchemaParseResult =
  | {
      valid: true;
      schema: JsonObject;
      errors: readonly string[];
      diagnostics: readonly SchemaDiagnostic[];
    }
  | {
      valid: false;
      schema: null;
      errors: readonly string[];
      diagnostics: readonly SchemaDiagnostic[];
    };
