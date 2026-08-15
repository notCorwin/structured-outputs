import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { jsonSchema, Output, streamText } from "ai";
import type {
  ChatModelAdapter,
  ChatModelRunResult,
  ThreadMessage,
} from "@assistant-ui/react";
import { schemaDescription, schemaTitle } from "./schema";
import type { ConnectionSettings, JsonObject } from "../types";

export interface ModelAdapterCallbacks {
  getConnection(): ConnectionSettings;
  getSchema(): JsonObject | null;
  onRunStart(): void;
  onRawChunk(chunk: string): void;
  onRunComplete(): void;
  onRunCancelled(): void;
  onRunError(error: unknown): void;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "");
}

function messageText(message: ThreadMessage): string {
  return message.content
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function lastUserPrompt(messages: readonly ThreadMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === "user") {
      return messageText(messages[index]);
    }
  }
  return "";
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "AbortError")
  );
}

function assertConnection(settings: ConnectionSettings): void {
  if (!settings.baseUrl.trim()) throw new Error("Base URL is required.");
  if (!settings.model.trim()) throw new Error("Model is required.");
  if (!settings.apiKey.trim()) throw new Error("API Key is required.");

  try {
    const url = new URL(settings.baseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Base URL must use http:// or https://.");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("must use")) throw error;
    throw new Error("Base URL must be a valid http:// or https:// URL.");
  }
}

export function createStructuredOutputAdapter(
  callbacks: ModelAdapterCallbacks,
): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }): AsyncGenerator<ChatModelRunResult> {
      const connection = callbacks.getConnection();
      const schema = callbacks.getSchema();
      const prompt = lastUserPrompt(messages);

      assertConnection(connection);
      if (schema == null) {
        throw new Error("Fix the JSON Schema before running the model.");
      }
      if (!prompt.trim()) {
        throw new Error("Prompt is required.");
      }

      callbacks.onRunStart();

      try {
        const provider = createOpenAICompatible({
          name: "structured-outputs-playground",
          baseURL: normalizeBaseUrl(connection.baseUrl),
          apiKey: connection.apiKey,
          includeUsage: true,
          // This playground intentionally exercises the provider's native JSON Schema path.
          supportsStructuredOutputs: true,
        });

        const result = streamText({
          model: provider(connection.model.trim()),
          prompt,
          abortSignal,
          output: Output.object({
            schema: jsonSchema(schema as Parameters<typeof jsonSchema>[0]),
            name: schemaTitle(schema),
            description: schemaDescription(schema),
          }),
        });

        for await (const chunk of result.textStream) {
          if (!chunk) continue;
          callbacks.onRawChunk(chunk);
          yield { content: [{ type: "text", text: chunk }] };
        }

        // Consume the validated result, but deliberately do not render it.
        await result.output;
        callbacks.onRunComplete();
      } catch (error) {
        if (abortSignal.aborted || isAbortError(error)) {
          callbacks.onRunCancelled();
          return;
        }

        callbacks.onRunError(error);
        throw error;
      }
    },
  };
}

export async function* streamRawChunks(
  chunks: AsyncIterable<string>,
  onChunk: (chunk: string) => void,
): AsyncGenerator<string> {
  for await (const chunk of chunks) {
    onChunk(chunk);
    yield chunk;
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  return "The model request failed.";
}
