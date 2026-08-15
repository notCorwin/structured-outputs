import { useMemo } from "react";
import { json } from "@codemirror/lang-json";
import { linter } from "@codemirror/lint";
import CodeMirror from "@uiw/react-codemirror";
import type { SchemaParseResult } from "../types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    <Card className="panel schema-panel gap-0 p-0" aria-labelledby="schema-heading">
      <CardHeader className="panel-heading border-b">
        <div>
          <p className="eyebrow">Input</p>
          <CardTitle id="schema-heading">JSON Schema</CardTitle>
          <CardDescription>Draft-07 sent through AI SDK Output.object().</CardDescription>
        </div>
        <CardAction className="panel-actions">
          <Badge
            variant={result.valid ? "secondary" : "destructive"}
            className={`validation-pill ${result.valid ? "valid" : "invalid"}`}
          >
            <span aria-hidden="true">{result.valid ? "✓" : "!"}</span>
            {result.valid ? "Draft-07 ready" : "Needs attention"}
          </Badge>
          <Button variant="outline" size="sm" type="button" onClick={onReset}>
            Reset sample
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="editor-frame min-h-0 flex-1 p-0" data-testid="schema-editor">
        <CodeMirror
          value={value}
          height="100%"
          extensions={extensions}
          basicSetup
          onChange={onChange}
          theme="light"
          aria-label="JSON Schema editor"
        />
      </CardContent>

      <CardFooter className="panel-footer schema-footer rounded-none bg-transparent">
        {result.valid ? (
          <span className="muted-text">The schema will be passed to AI SDK Output.object().</span>
        ) : (
          <ul className="error-list" aria-label="Schema errors">
            {result.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
            </ul>
          )}
      </CardFooter>
    </Card>
  );
}
