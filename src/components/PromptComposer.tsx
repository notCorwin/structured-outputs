import { ComposerPrimitive, useAui } from "@assistant-ui/react";
import { useEffect } from "react";
import type { FormEvent } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PromptComposerProps {
  prompt: string;
  canRun: boolean;
  canSend: boolean;
  isRunning: boolean;
  onPromptChange(value: string): void;
  onInvalidSubmit(): void;
}

export function PromptComposer({
  prompt,
  canRun,
  canSend,
  isRunning,
  onPromptChange,
  onInvalidSubmit,
}: PromptComposerProps) {
  const aui = useAui();

  useEffect(
    () => aui.on("thread.runEnd", () => queueMicrotask(syncPrompt)),
    [aui, prompt],
  );

  function syncPrompt() {
    const composer = aui.thread.composer();
    if (composer.getState().text !== prompt) composer.setText(prompt);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!canRun) {
      event.preventDefault();
      onInvalidSubmit();
      return;
    }

    syncPrompt();
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
          value={prompt}
          onChange={(event) => onPromptChange(event.currentTarget.value)}
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
            onClick={syncPrompt}
          >
            Run
          </ComposerPrimitive.Send>
        )}
      </ComposerPrimitive.Root>
    </Card>
  );
}
