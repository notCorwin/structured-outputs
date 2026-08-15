import { useEffect, useMemo, useRef, useState } from "react";
import {
  AssistantRuntimeProvider,
  useAui,
  useAuiState,
  useLocalRuntime,
} from "@assistant-ui/react";
import { ConnectionPanel } from "./components/ConnectionPanel";
import { PromptComposer } from "./components/PromptComposer";
import { RawResponsePanel } from "./components/RawResponsePanel";
import { SchemaEditor } from "./components/SchemaEditor";
import {
  DEFAULT_CONNECTION_SETTINGS,
  SAMPLE_PROMPT,
  SAMPLE_SCHEMA,
} from "./constants";
import {
  createStructuredOutputAdapter,
  errorMessage,
} from "./lib/model-adapter";
import { parseDraft7Schema } from "./lib/schema";
import {
  clearConnectionSettings,
  loadConnectionSettings,
  persistConnectionSettings,
} from "./lib/storage";
import type { ConnectionSettings, JsonObject, RunStatus, SchemaParseResult } from "./types";

function hasConnectionSettings(settings: ConnectionSettings): boolean {
  return Boolean(settings.baseUrl.trim() && settings.model.trim() && settings.apiKey.trim());
}

function Playground({
  schemaText,
  schemaResult,
  connection,
  storageWarning,
  rawResponse,
  runStatus,
  error,
  onSchemaChange,
  onResetSchema,
  onConnectionChange,
  onClearConnection,
  onClearResponse,
  onInvalidSubmit,
}: {
  schemaText: string;
  schemaResult: SchemaParseResult;
  connection: ConnectionSettings;
  storageWarning: boolean;
  rawResponse: string;
  runStatus: RunStatus;
  error: string | null;
  onSchemaChange(value: string): void;
  onResetSchema(): void;
  onConnectionChange(field: keyof ConnectionSettings, value: string): void;
  onClearConnection(): void;
  onClearResponse(): void;
  onInvalidSubmit(): void;
}) {
  const aui = useAui();
  const isRunning = useAuiState((state) => state.thread.isRunning);
  const canSend = useAuiState((state) => state.thread.composer.canSend);
  const seededPrompt = useRef(false);
  const canRun = schemaResult.valid && hasConnectionSettings(connection);

  useEffect(() => {
    if (seededPrompt.current) return;
    seededPrompt.current = true;
    aui.thread.composer().setText(SAMPLE_PROMPT);
  }, [aui]);

  function resetSchema() {
    onResetSchema();
    aui.thread.composer().setText(SAMPLE_PROMPT);
  }

  function clearResponse() {
    if (isRunning) aui.thread.cancelRun();
    onClearResponse();
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="app-heading">
          <p className="eyebrow">AI SDK</p>
          <h1>Structured Outputs</h1>
          <p className="app-subtitle">
            Draft-07 schema <span aria-hidden="true">→</span> raw streamed response
          </p>
        </div>
        <div className="header-actions">
          <ConnectionPanel
            value={connection}
            storageWarning={storageWarning}
            onChange={onConnectionChange}
            onClear={onClearConnection}
          />
        </div>
      </header>

      <div className="workspace">
        <SchemaEditor
          value={schemaText}
          result={schemaResult}
          onChange={onSchemaChange}
          onReset={resetSchema}
        />
        <section className="right-column" aria-label="Prompt and response">
          <RawResponsePanel
            rawResponse={rawResponse}
            runStatus={runStatus}
            error={error}
            onClear={clearResponse}
          />
          <PromptComposer
            canRun={canRun}
            canSend={canSend}
            isRunning={isRunning}
            onInvalidSubmit={onInvalidSubmit}
          />
        </section>
      </div>

      <footer className="app-footer">
        <span>Browser-only · no request proxy · no response persistence</span>
        <a href="https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data" target="_blank" rel="noreferrer">
          AI SDK structured output docs ↗
        </a>
      </footer>
    </main>
  );
}

export default function App() {
  const [connection, setConnection] = useState<ConnectionSettings>(() => loadConnectionSettings());
  const [schemaText, setSchemaText] = useState(SAMPLE_SCHEMA);
  const [schemaResult, setSchemaResult] = useState<SchemaParseResult>(() =>
    parseDraft7Schema(SAMPLE_SCHEMA),
  );
  const [rawResponse, setRawResponse] = useState("");
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState(false);
  const connectionRef = useRef(connection);
  const schemaRef = useRef<JsonObject | null>(schemaResult.valid ? schemaResult.schema : null);
  const rawResponseRef = useRef("");

  useEffect(() => {
    setStorageWarning(!persistConnectionSettings(connection));
  }, [connection]);

  const adapter = useMemo(
    () =>
      createStructuredOutputAdapter({
        getConnection: () => connectionRef.current,
        getSchema: () => schemaRef.current,
        onRunStart: () => {
          rawResponseRef.current = "";
          setRawResponse("");
          setError(null);
          setRunStatus("running");
        },
        onRawChunk: (chunk) => {
          rawResponseRef.current += chunk;
          setRawResponse(rawResponseRef.current);
        },
        onRunComplete: () => setRunStatus("complete"),
        onRunCancelled: () => setRunStatus("cancelled"),
        onRunError: (requestError) => {
          setRunStatus("error");
          setError(errorMessage(requestError));
        },
      }),
    [],
  );
  const runtime = useLocalRuntime(adapter);

  function updateConnection(field: keyof ConnectionSettings, value: string) {
    const next = { ...connectionRef.current, [field]: value };
    connectionRef.current = next;
    setConnection(next);
    setError(null);
  }

  function updateSchema(value: string) {
    const nextResult = parseDraft7Schema(value);
    schemaRef.current = nextResult.valid ? nextResult.schema : null;
    setSchemaText(value);
    setSchemaResult(nextResult);
    setError(null);
  }

  function resetSchema() {
    const nextResult = parseDraft7Schema(SAMPLE_SCHEMA);
    schemaRef.current = nextResult.valid ? nextResult.schema : null;
    setSchemaText(SAMPLE_SCHEMA);
    setSchemaResult(nextResult);
    setRawResponse("");
    rawResponseRef.current = "";
    setError(null);
    setRunStatus("idle");
  }

  function clearConnection() {
    const cleared = clearConnectionSettings();
    const next = { ...DEFAULT_CONNECTION_SETTINGS };
    connectionRef.current = next;
    setConnection(next);
    setStorageWarning(!cleared);
    setError(null);
  }

  function clearResponse() {
    rawResponseRef.current = "";
    setRawResponse("");
    setError(null);
    setRunStatus("idle");
  }

  function invalidSubmit() {
    if (!schemaResult.valid) {
      setError("Fix the JSON Schema before running the model.");
      return;
    }
    if (!hasConnectionSettings(connection)) {
      setError("Enter a Base URL, Model, and API Key before running the model.");
    }
  }

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Playground
        schemaText={schemaText}
        schemaResult={schemaResult}
        connection={connection}
        storageWarning={storageWarning}
        rawResponse={rawResponse}
        runStatus={runStatus}
        error={error}
        onSchemaChange={updateSchema}
        onResetSchema={resetSchema}
        onConnectionChange={updateConnection}
        onClearConnection={clearConnection}
        onClearResponse={clearResponse}
        onInvalidSubmit={invalidSubmit}
      />
    </AssistantRuntimeProvider>
  );
}
