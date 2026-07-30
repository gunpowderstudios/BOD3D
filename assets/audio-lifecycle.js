// BOD3D-TEST v12.33 — managed intro, dungeon and end-game music
(function () {
  'use strict';

  if (window.__bodAudioLifecycleV1164Installed) return;
  window.__bodAudioLifecycleV1164Installed = true;

  const MUTE_KEY = 'bod3dAmbienceMuted';
  const trackedMedia = new Set();
  const originalPlay = HTMLMediaElement.prototype.play;
  let muted = false;
  let pageActive = !document.hidden;
  let endingActive = false;
  let endGameAudio = null;

  try {
    muted = localStorage.getItem(MUTE_KEY) === 'true';
  } catch (_) {}

  function isAmbience(media) {
    const src = String(media.currentSrc || media.src || '');
    return media.loop ||
      /(?:dungeon-sounds|distant-monsters|end-game-music)\.(?:mp3|ogg|wav)(?:\?|$)/i.test(src);
  }

  function rememberMedia() {
    document.querySelectorAll('audio,video').forEach(media => {
      if (isAmbience(media)) trackedMedia.add(media);
    });
  }

  function pauseAllBackground() {
    rememberMedia();
    trackedMedia.forEach(media => {
      try { media.pause(); } catch (_) {}
    });
    document.querySelectorAll('audio,video').forEach(media => {
      if (!isAmbience(media)) return;
      try { media.pause(); } catch (_) {}
    });
  }

  function startScreenVisible() {
    const selectors = [
      '#charSelect',
      '#heroSelectOverlay',
      '#loadingScreen',
      '#loading-screen',
      '#startScreen',
      '#start-screen',
      '.loading-screen',
      '.start-screen',
      '.loadingScreen',
      '.startScreen'
    ];
    return selectors.some(selector => {
      const element = document.querySelector(selector);
      if (!element) return false;
      const style = getComputedStyle(element);
      return !element.hidden &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        element.getClientRects().length > 0;
    });
  }

  function stopBothAmbiences() {
    try { window.stopDungeonAmbience?.(); } catch (_) {}
    try { window.stopDistantMonstersAmbience?.(); } catch (_) {}
    pauseAllBackground();
  }

  function restoreCorrectAmbience() {
    if (!pageActive || document.hidden || muted) {
      stopBothAmbiences();
      return;
    }
    if (endingActive) {
      try { window.stopDungeonAmbience?.(); } catch (_) {}
      try { window.stopDistantMonstersAmbience?.(); } catch (_) {}
      if (endGameAudio?.paused) endGameAudio.play().catch(() => {});
    } else if (startScreenVisible()) {
      try { window.stopDungeonAmbience?.(); } catch (_) {}
      try { window.startDistantMonstersAmbience?.(); } catch (_) {}
    } else {
      try { window.stopDistantMonstersAmbience?.(); } catch (_) {}
      try { window.startDungeonAmbience?.(); } catch (_) {}
    }
  }

  function startEndGameMusic() {
    endingActive = true;
    try { window.stopDungeonAmbience?.(); } catch (_) {}
    try { window.stopDistantMonstersAmbience?.(); } catch (_) {}
    if (!endGameAudio) {
      endGameAudio = new Audio('./assets/sounds/end-game-music.mp3');
      endGameAudio.loop = true;
      endGameAudio.volume = 0.36;
      endGameAudio.preload = 'auto';
      trackedMedia.add(endGameAudio);
    }
    endGameAudio.currentTime = 0;
    if (!muted && pageActive && !document.hidden) {
      endGameAudio.play().catch(() => {});
    }
  }

  function stopEndGameMusic() {
    endingActive = false;
    if (!endGameAudio) return;
    endGameAudio.pause();
    endGameAudio.currentTime = 0;
  }

  window.startEndGameMusic = startEndGameMusic;
  window.stopEndGameMusic = stopEndGameMusic;

  function updateMuteButton() {
    const button = document.getElementById('dungeonSoundToggle');
    if (!button) return false;
    button.innerHTML = muted
      ? '<svg class="controlIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l4 4m0-4l-4 4"/></svg>'
      : '<svg class="controlIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5c1 .9 1.5 2.1 1.5 3.5S17 14.6 16 15.5"/><path d="M18.5 6c1.7 1.6 2.5 3.6 2.5 6s-.8 4.4-2.5 6"/></svg>';
    button.title = muted ? 'Sound muted — click to turn on' : 'Sound on — click to mute';
    button.setAttribute('aria-label', button.title);
    button.setAttribute('aria-pressed', muted ? 'true' : 'false');
    return true;
  }

  function setMuted(next) {
    muted = Boolean(next);
    window.__BOD_DUNGEON_AMBIENCE_MUTED__ = muted;
    window.__BOD_ALL_AMBIENCE_MUTED__ = muted;
    try { localStorage.setItem(MUTE_KEY, String(muted)); } catch (_) {}
    updateMuteButton();
    if (muted) stopBothAmbiences();
    else restoreCorrectAmbience();
  }

  function installMuteButton() {
    let button = document.getElementById('dungeonSoundToggle');
    if (!button) {
      const fullscreen = document.getElementById('fullscreenBtn');
      button = document.createElement('button');
      button.id = 'dungeonSoundToggle';
      button.type = 'button';
      if (fullscreen?.parentNode) {
        fullscreen.insertAdjacentElement('beforebegin', button);
      } else {
        (document.getElementById('main') || document.body).appendChild(button);
      }
    }
    button.style.removeProperty('display');
    button.hidden = false;
    button.onclick = event => {
      event.preventDefault();
      event.stopPropagation();
      setMuted(!muted);
    };
    updateMuteButton();
    return true;
  }

  HTMLMediaElement.prototype.play = function () {
    if (isAmbience(this)) trackedMedia.add(this);
    if (isAmbience(this) && (!pageActive || document.hidden || muted)) {
      try { this.pause(); } catch (_) {}
      return Promise.resolve();
    }
    return originalPlay.apply(this, arguments);
  };

  function leavePage() {
    pageActive = false;
    stopBothAmbiences();
  }

  function returnToPage() {
    pageActive = !document.hidden;
    if (pageActive) setTimeout(restoreCorrectAmbience, 80);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) leavePage();
    else returnToPage();
  }, true);
  window.addEventListener('pagehide', leavePage, true);
  window.addEventListener('beforeunload', leavePage, true);
  window.addEventListener('blur', () => {
    if (document.hidden) leavePage();
  }, true);
  window.addEventListener('pageshow', returnToPage, true);
  window.addEventListener('focus', returnToPage, true);

  function start() {
    window.__BOD_DUNGEON_AMBIENCE_MUTED__ = muted;
    window.__BOD_ALL_AMBIENCE_MUTED__ = muted;
    if (!installMuteButton()) {
      let attempts = 0;
      const timer = setInterval(() => {
        if (installMuteButton() || ++attempts > 120) clearInterval(timer);
      }, 50);
    }
    if (muted || document.hidden) stopBothAmbiences();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
