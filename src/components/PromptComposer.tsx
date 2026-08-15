import { ComposerPrimitive, useAui } from "@assistant-ui/react";
import { useCallback, useEffect, useRef } from "react";
import type { FormEvent } from "react";
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
  const aui = useAui();
  const draftRef = useRef("");

  const restoreDraft = useCallback(() => {
    const draft = draftRef.current;
    if (!draft.trim()) return;

    const composer = aui.thread.composer();
    if (composer.getState().text !== draft) composer.setText(draft);
  }, [aui]);

  useEffect(
    () =>
      aui.on("thread.runEnd", () => {
        queueMicrotask(restoreDraft);
      }),
    [aui, restoreDraft],
  );

  function preserveDraftAfterSend() {
    const composer = aui.thread.composer();
    draftRef.current = composer.getState().text;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!canRun) {
      event.preventDefault();
      onInvalidSubmit();
      return;
    }

    preserveDraftAfterSend();
  }

  return (
    <Card className="composer-shell p-3">
      <div className="composer-label">
        <span className="composer-title">Prompt</span>
      </div>
      <ComposerPrimitive.Root
        className="composer"
        onSubmit={handleSubmit}
      >
        <ComposerPrimitive.Input
          className="composer-input"
          placeholder="Describe the structured output you want..."
          rows={2}
          aria-label="Prompt"
          onChange={(event) => {
            draftRef.current = event.currentTarget.value;
          }}
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
            onClick={preserveDraftAfterSend}
          >
            Run
          </ComposerPrimitive.Send>
        )}
      </ComposerPrimitive.Root>
    </Card>
  );
}
