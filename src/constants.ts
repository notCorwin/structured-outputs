import type { ConnectionSettings } from "./types";

export const STORAGE_KEY = "structured-outputs-playground:connection";

export const DEFAULT_CONNECTION_SETTINGS: ConnectionSettings = {
  baseUrl: "https://api.openai.com/v1",
  model: "",
  apiKey: "",
};

export const SAMPLE_SCHEMA = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ProductReview",
  "description": "A concise product review with a rating and key points.",
  "type": "object",
  "properties": {
    "summary": {
      "type": "string",
      "description": "A one-sentence summary of the review."
    },
    "rating": {
      "type": "integer",
      "minimum": 1,
      "maximum": 5
    },
    "pros": {
      "type": "array",
      "items": { "type": "string" }
    },
    "cons": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["summary", "rating", "pros", "cons"],
  "additionalProperties": false
}`;

export const SAMPLE_PROMPT =
  "Write a short review of a compact mechanical keyboard with tactile switches.";
