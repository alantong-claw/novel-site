# Voice Prototype

A minimal push-to-talk mobile web prototype for talking to ClawChan.

## What it does

- Mobile-friendly web UI
- Browser built-in speech recognition first
- Sends recognized text to backend
- Backend forwards text to **real OpenClaw agent**
- Browser-native TTS can read replies aloud locally
- Optional ngrok startup script for outside access

## Fast start

Use the helper scripts:

```bash
cd /home/alantong/ai-work/voice_proto
./start_voice.sh
```

This will:
- start `voice_proto`
- try to start `ngrok` if found
- print the local health URL
- print the ngrok public URL when available

Check status:

```bash
./status_voice.sh
```

Stop everything:

```bash
./stop_voice.sh
```

## Default port

Default is `3110`.
You can override it:

```bash
PORT=3100 ./start_voice.sh
```

## Current state

This prototype now supports a real assistant loop:
- Browser speech recognition works when supported
- Backend text route works
- `/api/text` calls `openclaw agent --session-id ... --json`
- Conversation context is preserved through a stable OpenClaw session id
- Browser-native TTS can now read replies aloud when supported
- Optional OpenAI audio transcription path still exists if `OPENAI_API_KEY` is present

## Recommended path right now

Use **browser speech recognition** first.
Best chance of working: **Chrome on Android**.
If browser TTS is available, replies can also be spoken aloud locally on the phone.

## Manual run

```bash
cd voice_proto
npm install
npm start
```

If port 3100/3110 is busy:

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
- The next major step is polishing the startup UX further or replacing browser TTS with higher-quality voice output.
