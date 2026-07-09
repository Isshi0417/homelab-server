// =========================================================================
// Rapture Systems Telemetry & Dynamic Dossier Engine (Simplified)
// =========================================================================

// Audio Context
let audioCtx;

function initAudio() {
  if (audioCtx) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();
}

// Synthesizes a polished brass mechanical click for hover events
function playClickSound() {
  initAudio();
  if (!audioCtx || audioCtx.state === 'suspended') return;
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1600, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.02);
  
  gain.gain.setValueAtTime(0.025, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.02);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.02);
}

// -------------------------------------------------------------------------
// Interactive Systems Initialized
// -------------------------------------------------------------------------

// -------------------------------------------------------------------------
// FEATURE: Page-Wide Dynamic Bubble Trail (Following Cursor)
// -------------------------------------------------------------------------
let lastBubbleTime = 0;

function createHoverBubble(e) {
  const now = Date.now();
  if (now - lastBubbleTime < 45) return; // High frequency trail
  lastBubbleTime = now;

  const bubble = document.createElement('span');
  
  // Alternate between sparkling golden and cyan bubbles
  const isGold = Math.random() > 0.5;
  bubble.className = isGold ? 'hover-bubble bubble-gold-sparkle' : 'hover-bubble bubble-cyan-sparkle';

  // Spawn coordinates centered on cursor
  const size = Math.random() * 6 + 3; // 3px to 9px
  bubble.style.width = `${size}px`;
  bubble.style.height = `${size}px`;
  bubble.style.left = `${e.pageX}px`;
  bubble.style.top = `${e.pageY}px`;

  const drift = (Math.random() - 0.5) * 60; // Sway range
  bubble.style.setProperty('--drift', `${drift}px`);

  document.body.appendChild(bubble);

  // Remove bubble after animation ends
  setTimeout(() => {
    bubble.remove();
  }, 1200);
}

// Bind bubble trail to the entire page body
document.addEventListener('mousemove', createHoverBubble);

// Audio Context unlock triggers on first mouse click
document.body.addEventListener('click', () => {
  initAudio();
}, { once: true });

// Mechanical hover sound bindings for all links and cards
document.querySelectorAll('a, button, .tag, .card, .ryan-quote').forEach(el => {
  el.addEventListener('mouseenter', () => {
    playClickSound();
  });
});

// Fetch active VM count dynamically from status.json
function fetchActiveVMs() {
  fetch('status.json')
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(data => {
      if (data.active_vms !== undefined) {
        const el = document.getElementById('active-vm-count');
        if (el) {
          el.textContent = `${data.active_vms} Virtual Machines`;
        }
      }
    })
    .catch(() => {
      // Quietly fall back to default HTML value if not available locally
    });
}
fetchActiveVMs();
