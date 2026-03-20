# Voice Prototype

A minimal push-to-talk mobile web prototype for talking to ClawChan.

## What it does

- Mobile-friendly web UI
- Password gate before voice access
- Browser built-in speech recognition first
- Sends recognized text to backend
- Backend forwards text to **real OpenClaw agent**
- Browser-native TTS can read replies aloud locally
- Optional `cloudflared` startup script for outside access

## Fast start

Use the helper scripts:

```bash
cd /home/alantong/ai-work/voice_proto
./start_voice.sh
```

## Password protection

Voice access is now protected by `VOICE_PROTO_PASSWORD` in `.env`.
The UI requires unlocking first, and the backend also checks authorization.

Important:
- keep `.env` local
- do **not** commit secrets
- if you change the password, restart the server

## Current state

This prototype now supports a real assistant loop:
- Password-protected access
- Browser speech recognition works when supported
- Backend text route works
- `/api/text` calls `openclaw agent --session-id ... --json`
- Conversation context is preserved through a stable OpenClaw session id
- Browser-native TTS can now read replies aloud when supported
- Optional OpenAI audio transcription path still exists if `OPENAI_API_KEY` is present
- Optional `cloudflared` tunnel can send the public URL to Telegram when it changes
