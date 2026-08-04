// Bag of Dungeon 3D — background audio and lifecycle management
// Consolidated in TEST v12.67 from patches.js and assets/audio-lifecycle.js.
// Gameplay sound effects remain in game.js.

// ==================== Start-screen distant monster ambience (v10.90) ====================
/* v10.90 — Start-screen distant monster ambience */
(function () {
  const START_AMBIENCE_PATH = './assets/sounds/distant-monsters.mp3';
  let distantMonstersAudio = null;

  function startDistantMonstersAmbience() {
    if (!distantMonstersAudio) {
      distantMonstersAudio = new Audio(START_AMBIENCE_PATH);
      distantMonstersAudio.loop = true;
      distantMonstersAudio.volume = 0.28;
      distantMonstersAudio.preload = 'auto';
    }
    const p = distantMonstersAudio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        // Browser autoplay fallback: start on the player's first interaction.
        const resume = () => {
          distantMonstersAudio.play().catch(() => {});
          window.removeEventListener('pointerdown', resume);
          window.removeEventListener('keydown', resume);
          window.removeEventListener('touchstart', resume);
        };
        window.addEventListener('pointerdown', resume, { once: true });
        window.addEventListener('keydown', resume, { once: true });
        window.addEventListener('touchstart', resume, { once: true, passive: true });
      });
    }
  }

  function stopDistantMonstersAmbience() {
    if (!distantMonstersAudio) return;
    distantMonstersAudio.pause();
    distantMonstersAudio.currentTime = 0;
  }

  window.startDistantMonstersAmbience = startDistantMonstersAmbience;
  window.stopDistantMonstersAmbience = stopDistantMonstersAmbience;

  // Stop the ambience as soon as the start/loading screen disappears and dungeon play begins.
  function watchForDungeonEntry() {
    const observer = new MutationObserver(() => {
      const candidates = [
        document.getElementById('loadingScreen'),
        document.getElementById('loading-screen'),
        document.getElementById('startScreen'),
        document.getElementById('start-screen'),
        document.querySelector('.loading-screen'),
        document.querySelector('.start-screen'),
        document.querySelector('.loadingScreen'),
        document.querySelector('.startScreen')
      ].filter(Boolean);

      if (!candidates.length) return;
      const startVisible = candidates.some(el => {
        const s = getComputedStyle(el);
        return s.display !== 'none' && s.visibility !== 'hidden' &&
               s.opacity !== '0' && el.getClientRects().length > 0;
      });
      if (!startVisible) {
        stopDistantMonstersAmbience();
        observer.disconnect();
      }
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden']
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchForDungeonEntry, { once: true });
  } else {
    watchForDungeonEntry();
  }


  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startDistantMonstersAmbience, { once: true });
  } else {
    startDistantMonstersAmbience();
  }

  // Stop ambience when a start/enter/play control is used.
  document.addEventListener('click', function (event) {
    const el = event.target && event.target.closest ? event.target.closest('button, [role="button"]') : null;
    if (!el) return;
    const label = ((el.id || '') + ' ' + (el.className || '') + ' ' + (el.textContent || '')).toLowerCase();
    if (/(start|enter|play|begin|adventure)/.test(label)) {
      setTimeout(stopDistantMonstersAmbience, 50);
    }
  }, true);
})();


// ==================== Start-screen/dungeon ambience handoff (v10.90) ====================
/* v10.90 — Explicit start-screen/dungeon ambience handoff */
(function () {
  const DUNGEON_MUSIC_PLAYLIST = ['./assets/sounds/rock-track1.mp3'];
  let dungeonAmbienceAudio = null;
  let dungeonMusicIndex = 0;
  let dungeonAmbienceWanted = false;

  function startDungeonAmbience() {
    dungeonAmbienceWanted = true;
    if (window.stopDistantMonstersAmbience) window.stopDistantMonstersAmbience();
    if (window.__BOD_MUSIC_ENABLED__ === false || window.__BOD_MASTER_MUTED__) return;
    if (!dungeonAmbienceAudio) {
      dungeonAmbienceAudio = new Audio(DUNGEON_MUSIC_PLAYLIST[dungeonMusicIndex]);
      dungeonAmbienceAudio.loop = false;
      dungeonAmbienceAudio.volume = 0.32;
      dungeonAmbienceAudio.preload = 'auto';
      dungeonAmbienceAudio.addEventListener('ended', () => {
        dungeonMusicIndex = (dungeonMusicIndex + 1) % DUNGEON_MUSIC_PLAYLIST.length;
        dungeonAmbienceAudio.src = DUNGEON_MUSIC_PLAYLIST[dungeonMusicIndex];
        dungeonAmbienceAudio.play().catch(() => {});
      });
    }
    dungeonAmbienceAudio.play().catch(() => {});
  }

  function stopDungeonAmbience() {
    dungeonAmbienceWanted = false;
    if (!dungeonAmbienceAudio) return;
    dungeonAmbienceAudio.pause();
    dungeonAmbienceAudio.currentTime = 0;
  }

  window.startDungeonAmbience = startDungeonAmbience;
  window.stopDungeonAmbience = stopDungeonAmbience;
  window.ensureDungeonAmbience = function(){
    if(dungeonAmbienceWanted && dungeonAmbienceAudio && dungeonAmbienceAudio.paused){
      dungeonAmbienceAudio.play().catch(()=>{});
    }
  };
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden)window.ensureDungeonAmbience();
  });

  // The character-selection overlay is the reliable boundary between start screen and dungeon.
  function syncAmbienceToGameScreen() {
    const charSelect = document.getElementById('charSelect');
    if (!charSelect) return;

    const style = getComputedStyle(charSelect);
    const inDungeon =
      charSelect.classList.contains('hidden') ||
      charSelect.hidden ||
      style.display === 'none' ||
      style.visibility === 'hidden';

    if (inDungeon) {
      if (window.stopDistantMonstersAmbience) window.stopDistantMonstersAmbience();
      startDungeonAmbience();
    } else {
      stopDungeonAmbience();
    }
  }

  function installAmbienceHandoff() {
    const charSelect = document.getElementById('charSelect');
    if (!charSelect) return;
    syncAmbienceToGameScreen();

    new MutationObserver(syncAmbienceToGameScreen).observe(charSelect, {
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden']
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installAmbienceHandoff, { once: true });
  } else {
    installAmbienceHandoff();
  }
})();

// BOD3D-TEST v12.33 — managed intro, dungeon and end-game music
(function () {
  'use strict';

  if (window.__bodAudioLifecycleV1164Installed) return;
  window.__bodAudioLifecycleV1164Installed = true;

  const MUTE_KEY = 'bod3dAmbienceMuted';
  const MUSIC_KEY = 'bod3dMusicEnabled';
  const EFFECTS_KEY = 'bod3dEffectsEnabled';
  const trackedMedia = new Set();
  const originalPlay = HTMLMediaElement.prototype.play;
  let muted = false;
  let musicEnabled = true;
  let effectsEnabled = true;
  let pageActive = !document.hidden;
  let endingActive = false;
  let endGameAudio = null;

  try {
    muted = localStorage.getItem(MUTE_KEY) === 'true';
    musicEnabled = localStorage.getItem(MUSIC_KEY) !== 'false';
    effectsEnabled = localStorage.getItem(EFFECTS_KEY) !== 'false';
  } catch (_) {}
  window.__BOD_MASTER_MUTED__ = muted;
  window.__BOD_MUSIC_ENABLED__ = musicEnabled;
  window.__BOD_EFFECTS_ENABLED__ = effectsEnabled;

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
    if (!pageActive || document.hidden || muted || !musicEnabled) {
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
      endGameAudio.volume = 0.32;
      endGameAudio.preload = 'auto';
      trackedMedia.add(endGameAudio);
    }
    endGameAudio.currentTime = 0;
    if (!muted && musicEnabled && pageActive && !document.hidden) {
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
    window.__BOD_MASTER_MUTED__ = muted;
    window.__BOD_DUNGEON_AMBIENCE_MUTED__ = muted;
    window.__BOD_ALL_AMBIENCE_MUTED__ = muted;
    try {
      localStorage.setItem(MUTE_KEY, String(muted));
      localStorage.setItem('bodDigitalSoundOn', String(!muted));
    } catch (_) {}
    updateMuteButton();
    updateMusicButton();
    if (muted) stopBothAmbiences();
    else restoreCorrectAmbience();
  }

  function updateMusicButton() {
    const button = document.getElementById('dungeonMusicOptions');
    if (!button) return false;
    button.innerHTML = '<svg class="controlIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>';
    button.classList.toggle('audioOptionOff', !musicEnabled);
    button.title = 'Audio options — music ' + (musicEnabled ? 'on' : 'off') + ', effects ' + (effectsEnabled ? 'on' : 'off');
    button.setAttribute('aria-label', button.title);
    return true;
  }

  function setMusicEnabled(next) {
    musicEnabled = Boolean(next);
    window.__BOD_MUSIC_ENABLED__ = musicEnabled;
    try { localStorage.setItem(MUSIC_KEY, String(musicEnabled)); } catch (_) {}
    updateMusicButton();
    if (musicEnabled && !muted) restoreCorrectAmbience();
    else stopBothAmbiences();
  }

  function setEffectsEnabled(next) {
    effectsEnabled = Boolean(next);
    window.__BOD_EFFECTS_ENABLED__ = effectsEnabled;
    try { localStorage.setItem(EFFECTS_KEY, String(effectsEnabled)); } catch (_) {}
    updateMusicButton();
  }

  function openAudioOptions() {
    if (typeof window.showModal !== 'function') return;
    window.showModal(
      'AUDIO',
      'Choose music, sound effects, or both. The speaker button still mutes everything.',
      [
        {text:'Sound Effects: ' + (effectsEnabled ? 'ON' : 'OFF'),fn:()=>{setEffectsEnabled(!effectsEnabled);openAudioOptions();}},
        {text:'Music: ' + (musicEnabled ? 'ON' : 'OFF'),fn:()=>{setMusicEnabled(!musicEnabled);openAudioOptions();}},
        {text:'Close',fn:window.closeModal}
      ]
    );
  }

  function installMusicButton() {
    let button = document.getElementById('dungeonMusicOptions');
    if (!button) {
      const muteButton = document.getElementById('dungeonSoundToggle');
      button = document.createElement('button');
      button.id = 'dungeonMusicOptions';
      button.type = 'button';
      if (muteButton?.parentNode) muteButton.insertAdjacentElement('beforebegin', button);
      else (document.getElementById('main') || document.body).appendChild(button);
    }
    button.hidden = false;
    button.onclick = event => {
      event.preventDefault();
      event.stopPropagation();
      openAudioOptions();
    };
    updateMusicButton();
    return true;
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
    if (isAmbience(this) && (!pageActive || document.hidden || muted || !musicEnabled)) {
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
    window.__BOD_MASTER_MUTED__ = muted;
    window.__BOD_MUSIC_ENABLED__ = musicEnabled;
    window.__BOD_EFFECTS_ENABLED__ = effectsEnabled;
    window.__BOD_DUNGEON_AMBIENCE_MUTED__ = muted;
    window.__BOD_ALL_AMBIENCE_MUTED__ = muted;
    installMusicButton();
    if (!installMuteButton()) {
      let attempts = 0;
      const timer = setInterval(() => {
        if (installMuteButton() || ++attempts > 120) clearInterval(timer);
        installMusicButton();
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

