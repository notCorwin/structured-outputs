import { ComposerPrimitive } from "@assistant-ui/react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
    <Card className="composer-shell p-3">
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
          <ComposerPrimitive.Cancel
            className={buttonVariants({ variant: "destructive", size: "lg", className: "composer-action" })}
          >
            Stop
          </ComposerPrimitive.Cancel>
        ) : (
          <ComposerPrimitive.Send
            className={buttonVariants({ variant: "default", size: "lg", className: "composer-action" })}
            disabled={!canRun || !canSend}
          >
            Run
          </ComposerPrimitive.Send>
        )}
      </ComposerPrimitive.Root>
    </Card>
  );
}
