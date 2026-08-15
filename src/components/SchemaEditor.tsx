import { useMemo } from "react";
import { json } from "@codemirror/lang-json";
import { linter } from "@codemirror/lint";
import CodeMirror from "@uiw/react-codemirror";
import type { SchemaParseResult } from "../types";

interface SchemaEditorProps {
  value: string;
  result: SchemaParseResult;
  onChange(value: string): void;
  onReset(): void;
}

export function SchemaEditor({
  value,
  result,
  onChange,
  onReset,
}: SchemaEditorProps) {
  const extensions = useMemo(
    () => [
      json(),
      linter(() =>
        result.diagnostics.map((item) => ({
          from: Math.min(item.from, value.length),
          to: Math.min(Math.max(item.to, item.from), value.length),
          severity: "error" as const,
          message: item.message,
        })),
      ),
    ],
    [result.diagnostics, value.length],
  );

  return (
    <section className="panel schema-panel" aria-labelledby="schema-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Input</p>
          <h2 id="schema-heading">JSON Schema</h2>
        </div>
        <div className="panel-actions">
          <span className={`validation-pill ${result.valid ? "valid" : "invalid"}`}>
            <span aria-hidden="true">{result.valid ? "✓" : "!"}</span>
            {result.valid ? "Draft-07 ready" : "Needs attention"}
          </span>
          <button className="button button-quiet" type="button" onClick={onReset}>
            Reset sample
          </button>
        </div>
      </div>

      <div className="editor-frame" data-testid="schema-editor">
        <CodeMirror
          value={value}
          height="100%"
          extensions={extensions}
          basicSetup
          onChange={onChange}
          theme="dark"
          aria-label="JSON Schema editor"
        />
      </div>

      <div className="panel-footer schema-footer">
        {result.valid ? (
          <span className="muted-text">The schema will be passed to AI SDK Output.object().</span>
        ) : (
          <ul className="error-list" aria-label="Schema errors">
            {result.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
