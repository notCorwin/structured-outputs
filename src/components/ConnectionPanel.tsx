import type { ConnectionSettings } from "../types";

interface ConnectionPanelProps {
  value: ConnectionSettings;
  storageWarning: boolean;
  onChange(field: keyof ConnectionSettings, value: string): void;
  onClear(): void;
}

export function ConnectionPanel({
  value,
  storageWarning,
  onChange,
  onClear,
}: ConnectionPanelProps) {
  return (
    <section className="connection-panel" aria-labelledby="connection-heading">
      <div className="connection-heading">
        <div>
          <p className="eyebrow">Browser BYOK</p>
          <h2 id="connection-heading">Connection</h2>
        </div>
        <button className="button button-quiet" type="button" onClick={onClear}>
          Clear saved config
        </button>
      </div>

      <label className="field">
        <span>Base URL</span>
        <input
          aria-label="Base URL"
          value={value.baseUrl}
          onChange={(event) => onChange("baseUrl", event.target.value)}
          placeholder="https://api.openai.com/v1"
          inputMode="url"
          spellCheck={false}
        />
      </label>

      <label className="field">
        <span>Model</span>
        <input
          aria-label="Model"
          value={value.model}
          onChange={(event) => onChange("model", event.target.value)}
          placeholder="your-model-id"
          spellCheck={false}
        />
      </label>

      <label className="field">
        <span>API Key</span>
        <input
          aria-label="API Key"
          type="password"
          value={value.apiKey}
          onChange={(event) => onChange("apiKey", event.target.value)}
          placeholder="Stored in this browser"
          spellCheck={false}
        />
      </label>

      <p className="connection-note">
        The endpoint must allow CORS. Your key is sent directly from this page and saved in
        localStorage.
      </p>
      {storageWarning && (
        <p className="storage-warning" role="status">
          This browser blocked localStorage; connection settings will not persist.
        </p>
      )}
    </section>
  );
}
