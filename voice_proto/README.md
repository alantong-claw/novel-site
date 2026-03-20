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
  - current TTS mode (`browser-speech-synthesis` or `openai-audio-speech`)
- No API key path is fully supported: the browser speaks replies locally via native speech synthesis

## Current state

This prototype now supports a real assistant loop:
- Browser speech recognition works when supported
- Backend text route works
- `/api/text` calls `openclaw agent --session-id ... --json`
- Conversation context is preserved through a stable OpenClaw session id
- Browser-native TTS can now read replies aloud when supported
- Optional OpenAI audio transcription path still exists if `OPENAI_API_KEY` is present
- Optional OpenAI TTS path now writes generated reply audio under `public/generated/` and returns `audioUrl`

## Recommended path right now

Use the **no-API-key browser path** first:
- browser speech recognition for input
- browser native speech synthesis for output

Best chance of working: **Chrome on Android**.
This is the preferred default when you do not want to depend on cloud TTS.

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
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TTS_VOICE=alloy
OPENAI_TTS_FORMAT=mp3
VOICE_PROTO_AUDIO_TTL_MS=1800000
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
  "audioUrl": null,
  "ttsMode": "browser-speech-synthesis"
}
```

If cloud TTS is configured, `audioUrl` may contain a generated audio file and `ttsMode` will be `openai-audio-speech`.

### `POST /api/talk`
Multipart form upload with field `audio`.
This is only useful if OpenAI transcription is configured.

### `GET /api/health`
Shows service health, STT mode, TTS mode, and current OpenClaw session id.

## Notes

- `SpeechRecognition` support depends on browser/platform.
- If unsupported, we can next try local Whisper.
- The next major step is replacing stubbed TTS with real voice output.
