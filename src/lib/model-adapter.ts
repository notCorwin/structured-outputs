import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  APICallError,
  extractJsonMiddleware,
  jsonSchema,
  NoObjectGeneratedError,
  Output,
  streamText,
  wrapLanguageModel,
} from "ai";
import type { LanguageModelV4StreamPart } from "@ai-sdk/provider";
import type { LanguageModelMiddleware } from "ai";
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

function extractJsonDocument(text: string): string {
  const trimmed = text.trim();
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < trimmed.length; index += 1) {
    const character = trimmed[index];

    if (start < 0) {
      if (character === "{") {
        start = index;
        depth = 1;
      }
      continue;
    }

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === "\\" && inString) {
      escaped = true;
      continue;
    }

    if (character === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;
    if (character === "{") depth += 1;
    if (character !== "}") continue;

    depth -= 1;
    if (depth === 0) return trimmed.slice(start, index + 1);
  }

  return trimmed;
}

function captureRawTextMiddleware(
  onText: (chunk: string) => void,
): LanguageModelMiddleware {
  return {
    specificationVersion: "v4",
    wrapStream: async ({ doStream }) => {
      const { stream, ...rest } = await doStream();

      return {
        ...rest,
        stream: stream.pipeThrough(
          new TransformStream<LanguageModelV4StreamPart, LanguageModelV4StreamPart>({
            transform(chunk, controller) {
              if (chunk.type === "text-delta") onText(chunk.delta);
              controller.enqueue(chunk);
            },
          }),
        ),
      };
    },
  };
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

        const model = wrapLanguageModel({
          model: provider(connection.model.trim()),
          // Capture provider text before compatibility cleanup, while allowing
          // Output.object() to parse common fenced/prefixed JSON responses.
          middleware: [
            extractJsonMiddleware({ transform: extractJsonDocument }),
            captureRawTextMiddleware(callbacks.onRawChunk),
          ],
        });

        const result = streamText({
          model,
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
  if (APICallError.isInstance(error)) {
    const providerDetails = `${error.message} ${error.responseBody ?? ""}`;
    if (/response[_ -]?format|json[_ -]?schema|structured output|json mode/i.test(providerDetails)) {
      return "The endpoint rejected response_format.type=json_schema. Confirm that the selected model supports native structured outputs; JSON mode alone may not accept this schema.";
    }
  }

  if (NoObjectGeneratedError.isInstance(error)) {
    if (error.message.includes("could not parse")) {
      return "The endpoint returned content that is not a JSON object for this schema. This request used response_format.type=json_schema; confirm that the selected model supports native structured outputs. The raw response is preserved above.";
    }

    if (error.message.includes("did not match schema")) {
      return "The endpoint returned JSON, but it did not match this schema. Check the required fields and types, and confirm that the selected model supports native structured outputs. The raw response is preserved above.";
    }
  }

  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  return "The model request failed.";
}
