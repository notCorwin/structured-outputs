import { APICallError } from "ai";
import { errorMessage, streamRawChunks } from "./model-adapter";

async function* chunks() {
  yield "{\"summary\":";
  yield "\"A response\"}";
}

describe("model adapter helpers", () => {
  it("preserves stream chunks in their original order", async () => {
    const received: string[] = [];
    const yielded: string[] = [];

    for await (const chunk of streamRawChunks(chunks(), (value) => received.push(value))) {
      yielded.push(chunk);
    }

    expect(received.join("")).toBe('{"summary":"A response"}');
    expect(yielded).toEqual(received);
  });

  it("normalizes unknown errors for the UI", () => {
    expect(errorMessage(new Error("CORS blocked"))).toBe("CORS blocked");
    expect(errorMessage("Request failed")).toBe("Request failed");
    expect(errorMessage({})).toBe("The model request failed.");
  });

  it("explains when the endpoint rejects native structured output", () => {
    const error = new APICallError({
      message: "Unsupported response_format",
      url: "https://provider.example/v1/chat/completions",
      requestBodyValues: {},
      statusCode: 400,
      responseBody: JSON.stringify({ error: { message: "json_schema is not supported" } }),
    });

    expect(errorMessage(error)).toContain("response_format.type=json_schema");
    expect(errorMessage(error)).toContain("native structured outputs");
  });
});
