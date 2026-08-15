import type { ConnectionSettings } from "../types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface ConnectionPanelProps {
  value: ConnectionSettings;
  storageWarning: boolean;
  onChange(field: keyof ConnectionSettings, value: string): void;
  onClear(): void;
}

function hasConnectionSettings(settings: ConnectionSettings): boolean {
  return Boolean(settings.baseUrl.trim() && settings.model.trim() && settings.apiKey.trim());
}

export function ConnectionPanel({
  value,
  storageWarning,
  onChange,
  onClear,
}: ConnectionPanelProps) {
  const isConfigured = hasConnectionSettings(value);

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="connection-trigger" />
        }
      >
        Connection
        <Badge variant={isConfigured ? "secondary" : "outline"}>
          {isConfigured ? "ready" : "setup"}
        </Badge>
      </DialogTrigger>

      <DialogContent className="connection-dialog">
        <DialogHeader>
          <DialogTitle>Connection</DialogTitle>
          <DialogDescription>
            Configure the browser-side OpenAI-compatible endpoint for this playground.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="connection-fields connection-dialog-fields">
          <Field className="connection-field">
            <FieldLabel htmlFor="base-url">Base URL</FieldLabel>
            <Input
              id="base-url"
              aria-label="Base URL"
              value={value.baseUrl}
              onChange={(event) => onChange("baseUrl", event.target.value)}
              placeholder="https://api.openai.com/v1"
              inputMode="url"
              spellCheck={false}
            />
          </Field>

          <Field className="connection-field">
            <FieldLabel htmlFor="model">Model</FieldLabel>
            <Input
              id="model"
              aria-label="Model"
              value={value.model}
              onChange={(event) => onChange("model", event.target.value)}
              placeholder="your-model-id"
              spellCheck={false}
            />
          </Field>

          <Field className="connection-field">
            <FieldLabel htmlFor="api-key">API Key</FieldLabel>
            <Input
              id="api-key"
              aria-label="API Key"
              type="password"
              value={value.apiKey}
              onChange={(event) => onChange("apiKey", event.target.value)}
              placeholder="Stored in this browser"
              spellCheck={false}
            />
          </Field>
        </FieldGroup>

        <Separator />
        <DialogFooter className="connection-dialog-footer">
          <div className="connection-dialog-note">
            <p>
              The endpoint must allow CORS. The key is sent directly from this page and saved in
              localStorage.
            </p>
            {storageWarning && (
              <Alert variant="destructive" role="status">
                <AlertTitle>localStorage unavailable</AlertTitle>
                <AlertDescription>
                  This browser blocked localStorage; connection settings will not persist.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <div className="connection-dialog-actions">
            <Button variant="outline" type="button" onClick={onClear}>
              Clear saved config
            </Button>
            <DialogClose render={<Button variant="default" />}>Done</DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
