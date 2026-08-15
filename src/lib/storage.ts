import {
  DEFAULT_CONNECTION_SETTINGS,
  STORAGE_KEY,
} from "../constants";
import type { ConnectionSettings } from "../types";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadConnectionSettings(
  storage: Storage | null = browserStorage(),
): ConnectionSettings {
  if (storage == null) return { ...DEFAULT_CONNECTION_SETTINGS };

  try {
    const value: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? "null");
    if (typeof value !== "object" || value === null) {
      return { ...DEFAULT_CONNECTION_SETTINGS };
    }

    const record = value as Record<string, unknown>;
    return {
      baseUrl: isString(record.baseUrl)
        ? record.baseUrl
        : DEFAULT_CONNECTION_SETTINGS.baseUrl,
      model: isString(record.model)
        ? record.model
        : DEFAULT_CONNECTION_SETTINGS.model,
      apiKey: isString(record.apiKey)
        ? record.apiKey
        : DEFAULT_CONNECTION_SETTINGS.apiKey,
    };
  } catch {
    return { ...DEFAULT_CONNECTION_SETTINGS };
  }
}

export function persistConnectionSettings(
  settings: ConnectionSettings,
  storage: Storage | null = browserStorage(),
): boolean {
  if (storage == null) return false;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

export function clearConnectionSettings(
  storage: Storage | null = browserStorage(),
): boolean {
  if (storage == null) return false;

  try {
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
