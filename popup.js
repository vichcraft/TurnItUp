// Volume Booster Popup Script
const gainSlider = document.getElementById('gainSlider');
const gainDisplay = document.getElementById('gainDisplay');
const statusElement = document.getElementById('status');
const muteBtn = document.getElementById('muteBtn');
const resetBtn = document.getElementById('resetBtn');
const meterContainer = document.getElementById('meter');

let currentTabId = null;
let isMuted = false;
let previousGain = 1.0;

// Initialize meter segments
function initMeter() {
  meterContainer.innerHTML = '';
  for (let i = 0; i < 15; i++) {
    const segment = document.createElement('div');
    segment.className = 'meter-segment';
    meterContainer.appendChild(segment);
  }
}

// Update the display based on gain value
function updateDisplay(gain) {
  const percentage = Math.round(gain * 100);
  gainDisplay.textContent = `${percentage}%`;
  gainSlider.value = gain;

  // Update meter
  const segments = document.querySelectorAll('.meter-segment');
  const activeCount = Math.min(segments.length, Math.ceil((gain / 5) * segments.length));

  segments.forEach((seg, i) => {
    seg.className = 'meter-segment';
    if (i < activeCount) {
      if (i < 5) seg.classList.add('active-low');
      else if (i < 10) seg.classList.add('active-mid');
      else seg.classList.add('active-high');
    }
  });

  // Icons
  const speakerIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
  const muteIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;

  // Update mute button state
  if (gain <= 0.01) {
    muteBtn.classList.add('active');
    muteBtn.innerHTML = `${muteIcon} <span>UNMUTE</span>`;
    isMuted = true;
  } else {
    muteBtn.classList.remove('active');
    muteBtn.innerHTML = `${speakerIcon} <span>MUTE</span>`;
    isMuted = false;
  }
}

// Send gain value to content script
async function setGain(gain) {
  if (!currentTabId) return;

  try {
    const response = await chrome.tabs.sendMessage(currentTabId, {
      type: 'SET_GAIN',
      gain: gain
    });

    if (response && response.success) {
      updateDisplay(response.gain);
      updateStatus('VOL: ' + Math.round(response.gain * 100) + '%');
    }
  } catch (e) {
    updateStatus('NO MEDIA DETECTED', 'warning');
  }
}

// Get status from content script
async function getStatus() {
  if (!currentTabId) return;

  try {
    const response = await chrome.tabs.sendMessage(currentTabId, {
      type: 'GET_STATUS'
    });

    if (response) {
      updateDisplay(response.gain);

      if (response.audioContextState === 'suspended') {
        updateStatus('CLICK PAGE TO ACTIVATE', 'warning');
      } else if (response.mediaCount === 0) {
        updateStatus('NO MEDIA FOUND');
      } else {
        updateStatus(`${response.mediaCount} MEDIA ACTIVE`);
      }
    }
  } catch (e) {
    updateStatus('RELOAD PAGE', 'warning');
  }
}

// Update status text
function updateStatus(text, type = '') {
  statusElement.textContent = text;
  statusElement.className = 'status';
  if (type) {
    statusElement.classList.add(type);
  }
}

// Initialize
async function init() {
  initMeter();

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    updateStatus('NO ACTIVE TAB', 'error');
    return;
  }

  // Check if we can access this tab
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    updateStatus('CANNOT BOOST HERE', 'error');
    gainSlider.disabled = true;
    return;
  }

  currentTabId = tab.id;

  // Get current status
  await getStatus();

  // Slider event listener
  gainSlider.addEventListener('input', (e) => {
    const gain = parseFloat(e.target.value);
    updateDisplay(gain);
    setGain(gain);
  });

  // Preset button listeners
  const presetButtons = document.querySelectorAll('.preset-btn-small');
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const gain = parseFloat(btn.dataset.gain);
      setGain(gain);
    });
  });

  // Mute button listener
  muteBtn.addEventListener('click', () => {
    if (isMuted) {
      setGain(previousGain || 1.0);
    } else {
      previousGain = parseFloat(gainSlider.value);
      setGain(0);
    }
  });

  // Reset button listener
  resetBtn.addEventListener('click', () => {
    setGain(1.0);
  });
}

// Start
init();

