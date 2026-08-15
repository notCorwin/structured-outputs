import { useState } from "react";
import type { RunStatus } from "../types";

interface RawResponsePanelProps {
  rawResponse: string;
  runStatus: RunStatus;
  error: string | null;
  onClear(): void;
}

export function RawResponsePanel({
  rawResponse,
  runStatus,
  error,
  onClear,
}: RawResponsePanelProps) {
  const [copied, setCopied] = useState(false);

  async function copyResponse() {
    if (!rawResponse) return;

    try {
      await navigator.clipboard.writeText(rawResponse);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="panel response-panel" aria-labelledby="response-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Output</p>
          <h2 id="response-heading">Raw LLM response</h2>
        </div>
        <div className="panel-actions">
          <span className={`run-status status-${runStatus}`} role="status">
            {runStatus === "running" ? "Streaming" : runStatus}
          </span>
          <button
            className="button button-quiet"
            type="button"
            onClick={copyResponse}
            disabled={!rawResponse}
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <button className="button button-quiet" type="button" onClick={onClear} disabled={!rawResponse}>
            Clear
          </button>
        </div>
      </div>

      <div className="raw-output-frame" data-testid="raw-response">
        <pre>{rawResponse || "The model's generated text will appear here."}</pre>
      </div>

      {error && (
        <div className="request-error" role="alert">
          <strong>Request error</strong>
          <span>{error}</span>
        </div>
      )}
    </section>
  );
}
