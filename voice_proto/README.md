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
- STT / OpenClaw / TTS are currently stubbed

## Run

```bash
cd voice_proto
npm install
npm start
```

Open: http://localhost:3100

## Next integration points

1. Replace `fakeTranscribe()` with real STT
2. Replace `fakeAssistantReply()` with OpenClaw message/session integration
3. Replace `fakeSynthesize()` with real TTS

## Files

- `server.js` - Express server + API endpoints
- `public/index.html` - mobile UI
- `public/app.js` - recording/playback logic
- `public/style.css` - simple styling
