import { DEFAULT_CONNECTION_SETTINGS, STORAGE_KEY } from "../constants";
import type { ConnectionSettings } from "../types";
import {
  clearConnectionSettings,
  loadConnectionSettings,
  persistConnectionSettings,
} from "./storage";

describe("connection storage", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = new StorageShim();
  });

  it("loads defaults when no settings have been saved", () => {
    expect(loadConnectionSettings(storage)).toEqual(DEFAULT_CONNECTION_SETTINGS);
  });

  it("round-trips only the connection settings", () => {
    const settings: ConnectionSettings = {
      baseUrl: "https://gateway.example/v1",
      model: "demo-model",
      apiKey: "secret",
    };

    expect(persistConnectionSettings(settings, storage)).toBe(true);
    expect(loadConnectionSettings(storage)).toEqual(settings);
  });

  it("clears the stored key", () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ baseUrl: "x" }));

    expect(clearConnectionSettings(storage)).toBe(true);
    expect(loadConnectionSettings(storage)).toEqual(DEFAULT_CONNECTION_SETTINGS);
  });
});

class StorageShim implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}
