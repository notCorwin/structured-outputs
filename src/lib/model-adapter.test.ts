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
});
