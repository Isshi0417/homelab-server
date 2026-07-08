// Rapture Radio Local Playlist Configuration (Only containing your 6 downloaded files)
const playlist = [
  {
    title: "Midnight, The Stars And You (1934) - Al Bowlly",
    src: "audio/Al Bowlly - Midnight,Stars And You.mp3"
  },
  {
    title: "Heartaches (1931) - Al Bowlly",
    src: "audio/Al Bowlly - Heartaches.mp3"
  },
  {
    title: "Belleville (1942) - Django Reinhardt",
    src: "audio/Django Reinhardt - Belleville.mp3"
  },
  {
    title: "Love Is The Sweetest Thing (1932) - Al Bowlly",
    src: "audio/Al Bowlly - Love Is the Sweetest Thing.mp3"
  },
  {
    title: "Nuages (1940) - Django Reinhardt",
    src: "audio/Django Reinhardt - Nuages.mp3"
  },
  {
    title: "Close Your Eyes (1933) - Al Bowlly",
    src: "audio/Al Bowlly - Close Your Eyes.mp3"
  }
];

let currentTrackIndex = 0;
let audioCtx;
let filterNode;
let sourceNode;
let isPlaying = false; // Explicit playback tracking flag

const audioElement = document.getElementById('radio-audio');
const playButton = document.getElementById('radio-toggle');
const volumeControl = document.getElementById('volume');
const nowPlayingText = document.querySelector('.now-playing');

// Load the initial track data
loadTrack(currentTrackIndex);

// Function to load a track by index
function loadTrack(index) {
  const track = playlist[index];
  audioElement.src = track.src;
  nowPlayingText.textContent = `TUNED: ${track.title}`;
}

// Function to initialize Audio Context & Filter
function initAudio() {
  if (audioCtx) return; // Initialize only once

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();

  sourceNode = audioCtx.createMediaElementSource(audioElement);

  // Apply AM Radio Bandpass Filter
  filterNode = audioCtx.createBiquadFilter();
  filterNode.type = 'bandpass';
  filterNode.frequency.value = 1100;
  filterNode.Q.value = 1.8;

  // Connection chain
  sourceNode.connect(filterNode);
  filterNode.connect(audioCtx.destination);
}

// Resilient Play/Pause toggle
playButton.addEventListener('click', () => {
  initAudio();
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  // Play synthetic mechanical switch SFX
  playSwitchSound();

  if (!isPlaying) {
    isPlaying = true;
    playButton.textContent = 'ON';
    playButton.classList.add('active');
    
    audioElement.play().catch(err => {
      console.error("Playback failed. Make sure the local file exists on disk!", err);
    });
  } else {
    audioElement.pause();
    isPlaying = false;
    playButton.textContent = 'OFF';
    playButton.classList.remove('active');
  }
});

// Auto-play next song when current one ends
audioElement.addEventListener('ended', () => {
  currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
  loadTrack(currentTrackIndex);
  
  if (isPlaying) {
    audioElement.play().catch(err => {
      console.error("Autoplay failed:", err);
    });
  }
});

// Adjust volume
volumeControl.addEventListener('input', (e) => {
  audioElement.volume = e.target.value;
});

// Dynamic Node Status Monitoring
function updateNodeStatuses() {
  fetch('status.json')
    .then(res => {
      if (!res.ok) throw new Error("status.json not ready yet");
      return res.json();
    })
    .then(data => {
      updateIndicator('status-ipa', data.ipa);
      updateIndicator('status-control', data.control);
      updateIndicator('status-web', data.web);
      updateIndicator('status-media', data.media);
    })
    .catch(err => {
      console.warn("Status check failed (waiting for script to run on VM):", err);
    });
}

function updateIndicator(id, isOnline) {
  const el = document.getElementById(id);
  if (!el) return;
  if (isOnline) {
    el.className = "status-indicator online";
  } else {
    el.className = "status-indicator offline";
  }
}

// Poll status.json every 10 seconds
setInterval(updateNodeStatuses, 10000);
updateNodeStatuses(); // Run immediately on page load

// Sound synthesis utilities (Pure Web Audio API, zero downloads required)
function playClickSound() {
  if (!audioCtx) return; // Wait for initial user click to enable audio
  if (audioCtx.state === 'suspended') return;
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1400, audioCtx.currentTime); // High pitch click
  osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.03);
  
  gain.gain.setValueAtTime(0.04, audioCtx.currentTime); // Soft volume
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03); // Rapid decay
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.03);
}

function playSwitchSound() {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') return;

  // Dual oscillator thick mechanical click sound
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(180, audioCtx.currentTime);
  osc1.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.08);

  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(260, audioCtx.currentTime);
  osc2.frequency.exponentialRampToValueAtTime(90, audioCtx.currentTime + 0.06);

  gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(audioCtx.destination);

  osc1.start();
  osc2.start();
  osc1.stop(audioCtx.currentTime + 0.1);
  osc2.stop(audioCtx.currentTime + 0.1);
}

// Bind mechanical hover sound clicks to all cards
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    playClickSound();
  });
});


