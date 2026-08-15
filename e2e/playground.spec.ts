import { expect, test } from "@playwright/test";

const STORAGE_KEY = "structured-outputs-playground:connection";

test("streams a mocked raw structured response and restores connection settings", async ({ page }) => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: "http://127.0.0.1:4173",
  });

  await page.addInitScript(
    ({ storageKey }) => {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          baseUrl: "https://mock-provider.example/v1",
          model: "mock-model",
          apiKey: "test-key",
        }),
      );
    },
    { storageKey: STORAGE_KEY },
  );

  await page.route("https://mock-provider.example/v1/chat/completions", async (route) => {
    const requestBody = JSON.parse(route.request().postData() ?? "{}");
    expect(requestBody.response_format.type).toBe("json_schema");

    const response = [
      'data: {"id":"mock","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"content":"{\\"summary\\":\\"A response\\","},"finish_reason":null}]}\n\n',
      'data: {"id":"mock","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"content":"\\"rating\\":4,\\"pros\\":[\\"Quiet\\"],\\"cons\\":[\\"Heavy\\"]}"},"finish_reason":null}]}\n\n',
      'data: {"id":"mock","object":"chat.completion.chunk","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":12,"completion_tokens":18,"total_tokens":30}}\n\n',
      "data: [DONE]\n\n",
    ].join("");

    await route.fulfill({
      status: 200,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
      },
      body: response,
    });
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Structured Outputs" })).toBeVisible();
  await expect(page.getByLabel("Base URL")).not.toBeVisible();
  await page.getByRole("button", { name: /Connection/ }).click();
  await expect(page.getByLabel("Base URL")).toHaveValue("https://mock-provider.example/v1");
  await expect(page.getByLabel("Model")).toHaveValue("mock-model");
  await expect(page.getByTestId("schema-editor")).toBeVisible();

  const editorScrollState = await page.locator(".cm-scroller").evaluate((element) => ({
    clientHeight: element.clientHeight,
    overflowY: getComputedStyle(element).overflowY,
    scrollHeight: element.scrollHeight,
  }));
  expect(editorScrollState.overflowY).toBe("auto");
  expect(editorScrollState.scrollHeight).toBeGreaterThan(editorScrollState.clientHeight);

  const lastSchemaLine = page.locator(".cm-line").last();
  await lastSchemaLine.scrollIntoViewIfNeeded();
  await expect(lastSchemaLine).toContainText("}");

  await page.getByRole("button", { name: "Done" }).click();

  await page.getByRole("button", { name: "Run" }).click();
  await expect(page.getByTestId("raw-response")).toContainText('"summary":"A response"');
  await expect(page.getByTestId("raw-response")).toContainText('"rating":4');
  await expect(page.getByRole("status").filter({ hasText: "complete" })).toBeVisible();
  await page.getByRole("button", { name: "Copy" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: /Connection/ }).click();
  await expect(page.getByLabel("API Key")).toHaveValue("test-key");
});
