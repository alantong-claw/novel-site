# Voice Prototype

A minimal push-to-talk mobile web prototype for talking to ClawChan.

## What it does

- Mobile-friendly web UI
- Hold-to-record / tap-to-record
- Uploads audio to backend
- Backend returns:
  - transcript
  - assistant text reply
  - optional audio reply URL

## Current state

This is a prototype skeleton.
- Browser recording works
- Backend upload route works
- STT is now wired to OpenAI if `OPENAI_API_KEY` is present
- OpenClaw conversation and TTS are still stubbed

## Run

```bash
cd voice_proto
cp .env.example .env   # optional
npm install
npm start
```

Open: http://localhost:3100

## Environment

- `OPENAI_API_KEY` - required for real transcription
- `OPENAI_TRANSCRIBE_MODEL` - default: `gpt-4o-mini-transcribe`
- `OPENAI_TRANSCRIBE_LANGUAGE` - default: `zh`
- `PORT` - default: `3100`

## API

### `POST /api/talk`
Multipart form upload with field `audio`.

Returns JSON:

```json
{
  "transcript": "...",
  "replyText": "...",
  "audioUrl": null
}
```

### `GET /api/health`
Shows service health and current STT mode.

## Next integration points

1. Replace `fakeAssistantReply()` with OpenClaw message/session integration
2. Replace `fakeSynthesize()` with real TTS
3. Expose the page externally for mobile access

## Files

- `server.js` - Express server + API endpoints
- `public/index.html` - mobile UI
- `public/app.js` - recording/playback logic
- `public/style.css` - simple styling
