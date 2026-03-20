const statusEl = document.getElementById('status');
const btn = document.getElementById('recordBtn');
const transcriptEl = document.getElementById('transcript');
const replyTextEl = document.getElementById('replyText');
const replyAudio = document.getElementById('replyAudio');

let mediaRecorder;
let chunks = [];
let stream;
let isRecording = false;

async function ensureRecorder() {
  if (mediaRecorder) return;
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  mediaRecorder.onstop = async () => {
    const blob = new Blob(chunks, { type: 'audio/webm' });
    chunks = [];
    await sendAudio(blob);
  };
}

async function sendAudio(blob) {
  statusEl.textContent = 'Uploading audio...';
  const form = new FormData();
  form.append('audio', blob, 'recording.webm');

  const res = await fetch('/api/talk', { method: 'POST', body: form });
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

  statusEl.textContent = 'Ready';
}

async function startRecording() {
  await ensureRecorder();
  mediaRecorder.start();
  isRecording = true;
  btn.classList.add('recording');
  btn.textContent = 'Recording... Tap to Stop';
  statusEl.textContent = 'Listening...';
}

function stopRecording() {
  mediaRecorder.stop();
  isRecording = false;
  btn.classList.remove('recording');
  btn.textContent = 'Hold / Tap to Talk';
  statusEl.textContent = 'Processing...';
}

btn.addEventListener('click', async () => {
  try {
    if (!isRecording) await startRecording();
    else stopRecording();
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Microphone permission or recording failed';
  }
});
