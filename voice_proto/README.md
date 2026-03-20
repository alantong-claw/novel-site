# Voice Prototype

A minimal push-to-talk mobile web prototype for talking to ClawChan.

## What it does

- Mobile-friendly web UI
- Browser built-in speech recognition first
- Sends recognized text to backend
- Backend returns:
  - transcript
  - assistant text reply
  - optional audio reply URL

## Current state

This prototype now has a **no-API-key path**:
- Browser speech recognition works when supported
- Backend text route works
- OpenClaw conversation and TTS are still stubbed
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

Open: http://localhost:3100

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
Shows service health and current STT mode.

## Notes

- `SpeechRecognition` support depends on browser/platform.
- If unsupported, we can next try local Whisper.
- The next major step is replacing `fakeAssistantReply()` with real OpenClaw integration.
