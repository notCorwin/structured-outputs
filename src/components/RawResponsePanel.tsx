import { useState } from "react";
import type { RunStatus } from "../types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  const statusVariant = runStatus === "error" ? "destructive" : runStatus === "complete" ? "secondary" : "outline";

  return (
    <Card className="panel response-panel gap-0 p-0" aria-labelledby="response-heading">
      <CardHeader className="panel-heading border-b">
        <div>
          <CardTitle id="response-heading">Raw response</CardTitle>
        </div>
        <CardAction className="panel-actions">
          <Badge variant={statusVariant} className={`run-status status-${runStatus}`} role="status">
            {runStatus === "running" ? "Streaming" : runStatus}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={copyResponse}
            disabled={!rawResponse}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="outline" size="sm" type="button" onClick={onClear} disabled={!rawResponse}>
            Clear
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="raw-output-frame min-h-0 flex-1 p-0" data-testid="raw-response">
        <pre>{rawResponse || "The model's generated text will appear here."}</pre>
      </CardContent>

      {error && (
        <Alert variant="destructive" className="request-error rounded-none border-x-0 border-b-0">
          <AlertTitle>Request error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </Card>
  );
}
