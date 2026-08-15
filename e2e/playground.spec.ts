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

    const responseText = JSON.stringify({
      name: "Compact Tactile Keyboard",
      category: "keyboard",
      price: 99.99,
      reviewCount: 42,
      isAvailable: true,
      tags: ["compact", "tactile"],
      specifications: {
        layout: "65%",
        switchType: "tactile",
        wireless: true,
      },
      highlights: [
        { label: "Switches", value: "Tactile and hot-swappable", verified: true },
      ],
      lastReviewedAt: "2026-08-16T06:00:00Z",
      discontinuedAt: null,
    });
    const splitAt = Math.ceil(responseText.length / 2);
    const response = [responseText.slice(0, splitAt), responseText.slice(splitAt)]
      .map(
        (content) =>
          `data: ${JSON.stringify({
            id: "mock",
            object: "chat.completion.chunk",
            choices: [{ index: 0, delta: { content }, finish_reason: null }],
          })}\n\n`,
      )
      .concat(
        `data: ${JSON.stringify({
          id: "mock",
          object: "chat.completion.chunk",
          choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
        })}\n\n`,
        "data: [DONE]\n\n",
      )
      .join("");

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
  await expect(page.getByRole("main", { name: "Structured Outputs Playground" })).toBeVisible();
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

  await page.locator(".cm-scroller").evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(page.locator(".cm-line").last()).toContainText("}");

  await page.getByRole("button", { name: "Done" }).click();

  const prompt = "Return a complete catalog record for this keyboard.";
  await page.getByRole("textbox", { name: "Prompt" }).fill(prompt);
  await page.getByRole("button", { name: "Run" }).click();
  await expect(page.getByTestId("raw-response")).toContainText('"name":"Compact Tactile Keyboard"');
  await expect(page.getByTestId("raw-response")).toContainText('"discontinuedAt":null');
  await expect(page.getByRole("status").filter({ hasText: "complete" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Prompt" })).toHaveValue(prompt);
  await expect(page.getByRole("button", { name: "Run" })).toBeEnabled();
  await page.getByRole("button", { name: "Copy" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: /Connection/ }).click();
  await expect(page.getByLabel("API Key")).toHaveValue("test-key");
});
