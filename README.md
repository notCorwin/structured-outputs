# Structured Outputs Playground

A browser-only playground for testing JSON Schema structured outputs with the Vercel AI SDK and assistant-ui.

## Run locally

```bash
npm install
npm run dev
```

The page calls the configured OpenAI-compatible endpoint directly from the browser. The endpoint must allow CORS for the page origin and accept the `Authorization` header.

## Security model

This is a BYOK debugging tool. The Base URL, Model, and API Key are saved in `localStorage`; schema text, prompts, and responses are not persisted. Do not use a long-lived key in a shared or untrusted browser profile.

## GitHub Pages

The included workflow builds and deploys `dist` with GitHub Pages. Enable Pages in the repository settings with **GitHub Actions** as the source, then push to `master`.
