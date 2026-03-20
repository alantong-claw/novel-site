const statusEl = document.getElementById('status');
const btn = document.getElementById('recordBtn');
const transcriptEl = document.getElementById('transcript');
const replyTextEl = document.getElementById('replyText');
const replyAudio = document.getElementById('replyAudio');
const voiceSelect = document.getElementById('voiceSelect');
const speakToggle = document.getElementById('speakToggle');
const replayBtn = document.getElementById('replayBtn');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isRecording = false;
let lastReplyText = '';
let availableVoices = [];

function setReadyState(message = 'Ready') {
  statusEl.textContent = message;
}

function getSpeechSynthesis() {
  return window.speechSynthesis || null;
}

function supportsTts() {
  return !!getSpeechSynthesis() && typeof window.SpeechSynthesisUtterance !== 'undefined';
}

function loadVoices() {
  const synth = getSpeechSynthesis();
  if (!synth || !voiceSelect) return;

  availableVoices = synth.getVoices();
  voiceSelect.innerHTML = '';

  const autoOption = document.createElement('option');
  autoOption.value = '';
  autoOption.textContent = 'Auto voice';
  voiceSelect.appendChild(autoOption);

  for (const voice of availableVoices) {
    const option = document.createElement('option');
    option.value = voice.name;
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  }
}

function pickVoice() {
  const selected = voiceSelect?.value;
  if (selected) {
    return availableVoices.find((voice) => voice.name === selected) || null;
  }

  return (
    availableVoices.find((voice) => /zh-TW/i.test(voice.lang)) ||
    availableVoices.find((voice) => /zh/i.test(voice.lang)) ||
    availableVoices[0] ||
    null
  );
}

function speakText(text) {
  if (!supportsTts() || !text) return;

  const synth = getSpeechSynthesis();
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) voice.lang && (utterance.lang = voice.lang);
  if (voice) utterance.voice = voice;
  utterance.rate = 1;
  utterance.pitch = 1;

  utterance.onstart = () => setReadyState('Speaking...');
  utterance.onend = () => setReadyState('Ready');
  utterance.onerror = () => setReadyState('Speech playback failed');

  synth.speak(utterance);
}

async function sendText(text) {
  setReadyState('Sending text...');
  const res = await fetch('/api/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  const data = await res.json();
  transcriptEl.textContent = data.transcript || '(no transcript)';
  replyTextEl.textContent = data.replyText || '(no reply)';
  lastReplyText = data.replyText || '';
  replayBtn.disabled = !lastReplyText;

  if (data.audioUrl) {
    replyAudio.hidden = false;
    replyAudio.src = data.audioUrl;
    try { await replyAudio.play(); } catch {}
  } else {
    replyAudio.hidden = true;
    replyAudio.removeAttribute('src');
    replyAudio.load();
  }

  if (speakToggle?.checked && lastReplyText) {
    if (data.ttsMode === 'browser-speech-synthesis' || !data.audioUrl) {
      speakText(lastReplyText);
    } else {
      setReadyState('Playing reply...');
      replyAudio.onended = () => setReadyState('Ready');
      replyAudio.onerror = () => setReadyState('Audio playback failed');
    }
  } else {
    setReadyState('Ready');
  }
}

function ensureRecognition() {
  if (!SpeechRecognition) return null;
  if (recognition) return recognition;

  recognition = new SpeechRecognition();
  recognition.lang = 'zh-TW';
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onstart = () => {
    isRecording = true;
    btn.classList.add('recording');
    btn.textContent = 'Listening... Tap to Stop';
    setReadyState('Listening...');
  };

  recognition.onresult = async (event) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0]?.transcript || '')
      .join('')
      .trim();

    if (transcript) transcriptEl.textContent = transcript;

    const finalResult = Array.from(event.results).some((r) => r.isFinal);
    if (finalResult && transcript) {
      setReadyState('Processing...');
      await sendText(transcript);
    }
  };

  recognition.onerror = (event) => {
    console.error(event);
    setReadyState(`Speech recognition failed: ${event.error}`);
  };

  recognition.onend = () => {
    isRecording = false;
    btn.classList.remove('recording');
    btn.textContent = 'Tap to Talk';
    if (!statusEl.textContent.startsWith('Speech recognition failed') && statusEl.textContent !== 'Speaking...') {
      setReadyState('Ready');
    }
  };

  return recognition;
}

btn.addEventListener('click', async () => {
  const sr = ensureRecognition();
  if (!sr) {
    setReadyState('This browser does not support built-in speech recognition');
    return;
  }

  try {
    if (!isRecording) sr.start();
    else sr.stop();
  } catch (err) {
    console.error(err);
    setReadyState('Could not start speech recognition');
  }
});

replayBtn?.addEventListener('click', () => {
  if (lastReplyText) speakText(lastReplyText);
});

if (!SpeechRecognition) {
  setReadyState('SpeechRecognition not supported on this browser');
}

if (supportsTts()) {
  loadVoices();
  const synth = getSpeechSynthesis();
  if (typeof synth.onvoiceschanged !== 'undefined') {
    synth.onvoiceschanged = loadVoices;
  }
} else {
  if (voiceSelect) voiceSelect.disabled = true;
  if (speakToggle) speakToggle.disabled = true;
  if (replayBtn) replayBtn.disabled = true;
}
