# Search Chat

A single-user chat agent with web search and a persistent, dated conversation. Ask it about an earlier recommendation or what has changed since a previous discussion.

## Run locally

Requires Node.js 22.13 or newer and an OpenRouter API key with access to the selected model and web search. API use incurs charges.

```sh
npm install
cp .env.example .env
# Add OPENROUTER_API_KEY in .env
npm run dev
```

Open http://127.0.0.1:3000. The default model is `openrouter/free`; set `OPENROUTER_MODEL` in `.env` to choose a tool-capable OpenRouter model. Free-model availability and rate limits vary. Web search can incur charges even with a free model. `PORT` is optional. The server binds to localhost and is intended for one trusted local user; it has no authentication. Conversation history is stored in `data/chat.sqlite` and sent to OpenRouter and its model provider on each turn. Back up that file if you want to retain it; deleting it resets the conversation. No history exists before you start using this app. Time references use the browser's time zone, falling back to UTC.

Run `npm test` for deterministic tests. See [DESIGN.md](DESIGN.md) for architecture and limitations.
