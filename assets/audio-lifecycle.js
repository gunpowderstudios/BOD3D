// BOD3D-TEST v11.68 — reliable Android audio lifecycle with permanent mute button
(function () {
  'use strict';

  if (window.__bodAudioLifecycleV1164Installed) return;
  window.__bodAudioLifecycleV1164Installed = true;

  const MUTE_KEY = 'bod3dAmbienceMuted';
  const trackedMedia = new Set();
  const originalPlay = HTMLMediaElement.prototype.play;
  let muted = false;
  let pageActive = !document.hidden;

  try {
    muted = localStorage.getItem(MUTE_KEY) === 'true';
  } catch (_) {}

  function isAmbience(media) {
    const src = String(media.currentSrc || media.src || '');
    return media.loop ||
      /(?:dungeon-sounds|distant-monsters)\.(?:mp3|ogg|wav)(?:\?|$)/i.test(src);
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
    if (startScreenVisible()) {
      try { window.stopDungeonAmbience?.(); } catch (_) {}
      try { window.startDistantMonstersAmbience?.(); } catch (_) {}
    } else {
      try { window.stopDistantMonstersAmbience?.(); } catch (_) {}
      try { window.startDungeonAmbience?.(); } catch (_) {}
    }
  }

  function updateMuteButton() {
    const button = document.getElementById('dungeonSoundToggle');
    if (!button) return false;
    button.textContent = muted ? '🔇' : '🔊';
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
