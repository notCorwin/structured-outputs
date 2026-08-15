import type { ConnectionSettings } from "./types";

export const STORAGE_KEY = "structured-outputs-playground:connection";

export const DEFAULT_CONNECTION_SETTINGS: ConnectionSettings = {
  baseUrl: "https://api.openai.com/v1",
  model: "",
  apiKey: "",
};

export const SAMPLE_SCHEMA = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ProductCatalogRecord",
  "description": "A product record demonstrating every JSON Schema value type with nested objects and arrays.",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "The product name."
    },
    "category": {
      "type": "string",
      "enum": ["keyboard", "mouse", "monitor", "headphones"]
    },
    "price": {
      "type": "number",
      "description": "Current price in USD."
    },
    "reviewCount": {
      "type": "integer",
      "description": "Number of published reviews."
    },
    "isAvailable": {
      "type": "boolean",
      "description": "Whether the product can currently be ordered."
    },
    "tags": {
      "type": "array",
      "description": "A short list of searchable tags.",
      "items": { "type": "string" }
    },
    "specifications": {
      "type": "object",
      "description": "Structured product specifications.",
      "properties": {
        "layout": { "type": "string" },
        "switchType": { "type": "string" },
        "wireless": { "type": "boolean" }
      },
      "required": ["layout", "switchType", "wireless"],
      "additionalProperties": false
    },
    "highlights": {
      "type": "array",
      "description": "Notable product features.",
      "items": {
        "type": "object",
        "properties": {
          "label": { "type": "string" },
          "value": { "type": "string" },
          "verified": { "type": "boolean" }
        },
        "required": ["label", "value", "verified"],
        "additionalProperties": false
      }
    },
    "lastReviewedAt": {
      "type": "string",
      "description": "Review timestamp in ISO 8601 format."
    },
    "discontinuedAt": {
      "anyOf": [{ "type": "string" }, { "type": "null" }],
      "description": "ISO timestamp, or null while the product is still active."
    }
  },
  "required": [
    "name",
    "category",
    "price",
    "reviewCount",
    "isAvailable",
    "tags",
    "specifications",
    "highlights",
    "lastReviewedAt",
    "discontinuedAt"
  ],
  "additionalProperties": false
}`;

export const SAMPLE_PROMPT =
  "Create a product catalog record for a compact mechanical keyboard with tactile switches. Fill every field with realistic values, use an ISO timestamp for lastReviewedAt, and use null for discontinuedAt because the product is still active.";
