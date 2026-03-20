const statusEl = document.getElementById('status');
const btn = document.getElementById('recordBtn');
const transcriptEl = document.getElementById('transcript');
const replyTextEl = document.getElementById('replyText');
const replyAudio = document.getElementById('replyAudio');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isRecording = false;

function setReadyState(message = 'Ready') {
  statusEl.textContent = message;
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

  if (data.audioUrl) {
    replyAudio.src = data.audioUrl;
    try { await replyAudio.play(); } catch {}
  } else {
    replyAudio.removeAttribute('src');
    replyAudio.load();
  }

  setReadyState('Ready');
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
    if (!statusEl.textContent.startsWith('Speech recognition failed')) {
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

if (!SpeechRecognition) {
  setReadyState('SpeechRecognition not supported on this browser');
}
