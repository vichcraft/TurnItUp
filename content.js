// Volume Booster Content Script
// Uses Web Audio API with GainNode to boost volume beyond 100%

(function () {
  'use strict';

  let audioContext = null;
  let gainNode = null;
  let currentGain = 1.0;
  const processedMedia = new WeakSet();
  const mediaSourceMap = new WeakMap();

  // Initialize AudioContext (requires user interaction to resume)
  function initAudioContext() {
    if (audioContext) return audioContext;

    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      gainNode = audioContext.createGain();
      gainNode.gain.value = currentGain;
      gainNode.connect(audioContext.destination);
      return audioContext;
    } catch (e) {
      console.error('TurnItUp: Failed to create AudioContext', e);
      return null;
    }
  }

  // Resume AudioContext if suspended (handles autoplay policy)
  async function ensureAudioContextResumed() {
    if (!audioContext) {
      initAudioContext();
    }

    if (audioContext && audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
      } catch (e) {
        console.warn('TurnItUp: Could not resume AudioContext', e);
      }
    }
  }

  // Process a single media element
  function processMediaElement(media) {
    if (processedMedia.has(media)) return;
    if (!audioContext) initAudioContext();
    if (!audioContext) return;

    try {
      // Create MediaElementSource and connect through gain node
      const source = audioContext.createMediaElementSource(media);
      source.connect(gainNode);

      processedMedia.add(media);
      mediaSourceMap.set(media, source);

      // Ensure AudioContext resumes when media plays
      media.addEventListener('play', ensureAudioContextResumed, { once: false });

      console.log('TurnItUp: Processed media element', media);
    } catch (e) {
      // This can happen if the media element is already connected to another AudioContext
      // or if it's a cross-origin resource without CORS headers
      console.warn('TurnItUp: Could not process media element', e);
    }
  }

  // Find and process all media elements on the page
  function processAllMedia() {
    const mediaElements = document.querySelectorAll('audio, video');
    mediaElements.forEach(processMediaElement);
  }

  // Set up MutationObserver to detect dynamically added media elements
  function setupObserver() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // Check added nodes
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;

          // Check if the added node is a media element
          if (node.tagName === 'AUDIO' || node.tagName === 'VIDEO') {
            processMediaElement(node);
          }

          // Check for media elements within the added node
          if (node.querySelectorAll) {
            const mediaElements = node.querySelectorAll('audio, video');
            mediaElements.forEach(processMediaElement);
          }
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    return observer;
  }

  // Update gain value
  function setGain(value) {
    currentGain = Math.max(0, Math.min(5, value));

    if (gainNode) {
      gainNode.gain.value = currentGain;
    }

    // Store in session storage for this tab
    chrome.storage.session.set({ gain: currentGain });
  }

  // Load saved gain value for this tab
  async function loadSavedGain() {
    try {
      const result = await chrome.storage.session.get(['gain']);
      if (result.gain !== undefined) {
        currentGain = result.gain;
        if (gainNode) {
          gainNode.gain.value = currentGain;
        }
      }
    } catch (e) {
      console.warn('TurnItUp: Could not load saved gain', e);
    }
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SET_GAIN') {
      setGain(message.gain);
      ensureAudioContextResumed();
      sendResponse({ success: true, gain: currentGain });
    } else if (message.type === 'GET_GAIN') {
      sendResponse({ gain: currentGain });
    } else if (message.type === 'GET_STATUS') {
      sendResponse({
        gain: currentGain,
        audioContextState: audioContext ? audioContext.state : 'not initialized',
        mediaCount: document.querySelectorAll('audio, video').length
      });
    }
    return true; // Keep message channel open for async response
  });

  // Handle user interaction to resume AudioContext
  function setupInteractionHandler() {
    const resumeOnInteraction = async () => {
      await ensureAudioContextResumed();
    };

    // These events indicate user interaction
    document.addEventListener('click', resumeOnInteraction, { once: true });
    document.addEventListener('keydown', resumeOnInteraction, { once: true });
    document.addEventListener('touchstart', resumeOnInteraction, { once: true });
  }

  // Initialize
  function init() {
    initAudioContext();
    loadSavedGain();
    setupInteractionHandler();

    // Process existing media elements
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        processAllMedia();
        setupObserver();
      });
    } else {
      processAllMedia();
      setupObserver();
    }
  }

  init();
})();
