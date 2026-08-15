import { ComposerPrimitive } from "@assistant-ui/react";

interface PromptComposerProps {
  canRun: boolean;
  canSend: boolean;
  isRunning: boolean;
  onInvalidSubmit(): void;
}

export function PromptComposer({
  canRun,
  canSend,
  isRunning,
  onInvalidSubmit,
}: PromptComposerProps) {
  return (
    <div className="composer-shell">
      <div className="composer-label">
        <span className="eyebrow">Prompt</span>
        <span className="muted-text">One request per run · previous messages are ignored</span>
      </div>
      <ComposerPrimitive.Root
        className="composer"
        onSubmit={(event) => {
          if (!canRun) {
            event.preventDefault();
            onInvalidSubmit();
          }
        }}
      >
        <ComposerPrimitive.Input
          className="composer-input"
          placeholder="Describe the structured output you want..."
          rows={2}
          aria-label="Prompt"
        />
        {isRunning ? (
          <ComposerPrimitive.Cancel className="button button-danger">
            Stop
          </ComposerPrimitive.Cancel>
        ) : (
          <ComposerPrimitive.Send className="button button-primary" disabled={!canRun || !canSend}>
            Run
          </ComposerPrimitive.Send>
        )}
      </ComposerPrimitive.Root>
    </div>
  );
}
