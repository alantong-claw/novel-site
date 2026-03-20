# Voice Prototype

A minimal push-to-talk mobile web prototype for talking to ClawChan.

## What it does

- Mobile-friendly web UI
- Browser built-in speech recognition first
- Sends recognized text to backend
- Backend forwards text to **real OpenClaw agent**
- Backend returns:
  - transcript
  - assistant text reply
  - optional audio reply URL

## Current state

This prototype now supports a real assistant loop:
- Browser speech recognition works when supported
- Backend text route works
- `/api/text` calls `openclaw agent --session-id ... --json`
- Conversation context is preserved through a stable OpenClaw session id
- TTS is still stubbed
- Optional OpenAI audio transcription path still exists if `OPENAI_API_KEY` is present

## Recommended path right now

Use **browser speech recognition** first.
Best chance of working: **Chrome on Android**.

## Run

```bash
cd voice_proto
npm install
npm start
```

If port 3100 is busy:

```bash
PORT=3110 npm start
```

## Optional environment

```bash
VOICE_PROTO_SESSION_ID=voice-proto
VOICE_PROTO_TIMEOUT_MS=120000
VOICE_PROTO_THINKING=low
```

## API

### `POST /api/text`
JSON body:

```json
{ "text": "你好" }
```

Returns:

```json
{
  "transcript": "你好",
  "replyText": "...",
  "audioUrl": null
}
```

### `POST /api/talk`
Multipart form upload with field `audio`.
This is only useful if OpenAI transcription is configured.

### `GET /api/health`
Shows service health, STT mode, and current OpenClaw session id.

## Notes

- `SpeechRecognition` support depends on browser/platform.
- If unsupported, we can next try local Whisper.
- The next major step is replacing stubbed TTS with real voice output.
