import type { ConnectionSettings } from "../types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface ConnectionPanelProps {
  value: ConnectionSettings;
  storageWarning: boolean;
  onChange(field: keyof ConnectionSettings, value: string): void;
  onClear(): void;
}

export function ConnectionPanel({
  value,
  storageWarning,
  onChange,
  onClear,
}: ConnectionPanelProps) {
  return (
    <Card className="connection-panel" aria-labelledby="connection-heading">
      <CardHeader className="connection-heading">
        <div>
          <p className="eyebrow">Browser BYOK</p>
          <CardTitle id="connection-heading">Connection</CardTitle>
        </div>
        <Button variant="outline" size="sm" type="button" onClick={onClear}>
          Clear saved config
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <FieldGroup className="connection-fields">
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
      </CardContent>

      <Separator />
      <CardFooter className="connection-footer border-t-0 bg-transparent">
        <p className="connection-note">
          The endpoint must allow CORS. Your key is sent directly from this page and saved in
          localStorage.
        </p>
        {storageWarning && (
          <Alert variant="destructive" role="status" className="storage-warning">
            <AlertTitle>localStorage unavailable</AlertTitle>
            <AlertDescription>
              This browser blocked localStorage; connection settings will not persist.
            </AlertDescription>
          </Alert>
        )}
      </CardFooter>
    </Card>
  );
}
