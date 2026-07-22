// Bag of Dungeon 3D — small UI/audio patch scripts.
// Split out of index.html for easier editing. Each patch below is a self-contained IIFE
// (or, for the last one, simple globals) and can be edited independently of the rest.

// ==================== Logo load fallback (v10.58) ====================
(function(){
 const logo=document.getElementById('heroSelectLogo');
 if(!logo)return;

 const candidates=[
  './assets/ui/bod3d-logo.png?v=10.58',
  'assets/ui/bod3d-logo.png?v=10.58'
 ];
 let candidateIndex=0;

 logo.addEventListener('load',()=>{
  console.info('BOD3D logo loaded:',logo.currentSrc||logo.src);
 });

 logo.addEventListener('error',()=>{
  candidateIndex++;
  if(candidateIndex<candidates.length){
   console.warn('BOD3D logo failed; trying:',candidates[candidateIndex]);
   logo.src=candidates[candidateIndex];
  }else{
   console.error(
    'BOD3D logo could not be found. Expected GitHub file: assets/ui/bod3d-logo.png'
   );
   logo.style.display='none';
  }
 });
})();


// ==================== Fullscreen control (v11.20) ====================
    // v11.20: Small top-right fullscreen control. The browser's native Esc key exits.
    (function(){
      const button=document.getElementById('fullscreenBtn');
      if(!button)return;
      const fullscreenElement=()=>document.fullscreenElement||document.webkitFullscreenElement;
      button.addEventListener('click',async()=>{
        try{
          if(fullscreenElement()){
            if(document.exitFullscreen)await document.exitFullscreen();
            else if(document.webkitExitFullscreen)document.webkitExitFullscreen();
          }else{
            const root=document.documentElement;
            if(root.requestFullscreen)await root.requestFullscreen();
            else if(root.webkitRequestFullscreen)root.webkitRequestFullscreen();
            else toast('Full screen is not supported by this browser.');
          }
        }catch(error){console.warn('Full screen request failed:',error);}
      });
      const syncFullscreenButton=()=>{
        const active=!!fullscreenElement();
        button.textContent=active?'×':'⛶';
        button.title=active?'Exit full screen (or press Esc)':'Full screen — press Esc to exit';
        button.setAttribute('aria-label',active?'Exit full screen':'Enter full screen');
      };
      document.addEventListener('fullscreenchange',syncFullscreenButton);
      document.addEventListener('webkitfullscreenchange',syncFullscreenButton);
    })();


// ==================== Smooth hero-follow camera manual-override grace period (v10.67) ====================
/* v10.67 — smooth hero-follow camera. Keeps the hero centred after normal movement,
   but respects manual camera control (zoom/rotate/pan) until the next movement settles. */
(function(){
  let manualCameraUntil=0;
  const MANUAL_GRACE_MS=1800;
  const markManual=()=>{manualCameraUntil=performance.now()+MANUAL_GRACE_MS;};

  ['wheel','pointerdown','touchstart'].forEach(type=>{
    window.addEventListener(type,e=>{
      const t=e.target;
      if(t && (t.closest?.('#viewport') || t.closest?.('#threeBoard') || t.closest?.('#zoomIn') || t.closest?.('#zoomOut') || t.closest?.('#centreBtn') || t.closest?.('#viewBtn') || t.closest?.('#compass'))) markManual();
    },{passive:true,capture:true});
  });

  // Wrap renderBoard so ordinary hero moves smoothly bring the dungeon back under the hero.
  const install=()=>{
    if(typeof window.renderBoard!=='function' || window.__bodHeroFollowInstalled)return false;
    window.__bodHeroFollowInstalled=true;
    const original=window.renderBoard;
    window.renderBoard=async function(state){
      const result=await original.apply(this,arguments);
      try{
        if(!state || !state.player) return result;
        if(document.body.classList.contains('combatActive')) return result;
        if(performance.now()<manualCameraUntil) return result;
        const centre=window.centreCameraOnHero || (typeof centreCameraOnHero==='function'?centreCameraOnHero:null);
        if(typeof centre==='function'){
          const world=document.getElementById('world');
          if(world) world.classList.add('cameraSmooth');
          centre();
          setTimeout(()=>world&&world.classList.remove('cameraSmooth'),360);
        }
      }catch(e){console.warn('Hero follow camera:',e);}
      return result;
    };
    return true;
  };
  if(!install()){
    let tries=0; const timer=setInterval(()=>{if(install()||++tries>80)clearInterval(timer);},50);
  }
})();


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
  const DUNGEON_AMBIENCE_PATH = './assets/sounds/dungeon-sounds.mp3';
  let dungeonAmbienceAudio = null;
  let dungeonAmbienceWanted = false;

  function startDungeonAmbience() {
    dungeonAmbienceWanted = true;
    if (window.stopDistantMonstersAmbience) window.stopDistantMonstersAmbience();
    if (!dungeonAmbienceAudio) {
      dungeonAmbienceAudio = new Audio(DUNGEON_AMBIENCE_PATH);
      dungeonAmbienceAudio.loop = true;
      dungeonAmbienceAudio.volume = 0.28;
      dungeonAmbienceAudio.preload = 'auto';
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


// ==================== Hide mystery counters (v10.90) ====================
(function(){
 function hideMysteryCounters(){
  document.querySelectorAll('button,div,span').forEach(function(el){
   var t=(el.textContent||'').trim();
   if(/^(Tiles|Monsters|Items)\s+\d+$/.test(t) && el.children.length===0){
    el.style.setProperty('display','none','important');
   }
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hideMysteryCounters,{once:true});
 else hideMysteryCounters();
 new MutationObserver(hideMysteryCounters).observe(document.documentElement,{subtree:true,childList:true,characterData:true});
})();


// ==================== Version placement under logo ====================
(function(){
 function placeVersionUnderLogo(){
  if(document.getElementById('topLogoVersion'))return;
  const imgs=[...document.querySelectorAll('img')];
  const logo=imgs.find(img=>/bod3d-logo|bod3d_logo|logo/i.test((img.getAttribute('src')||'')));
  if(!logo)return;
  const known=logo.closest('#logoWrap,#gameLogoWrap,.logoWrap,.gameLogoWrap,.topLogo,.brandLogo');
  if(known)return;
  const v=document.createElement('div');
  v.id='topLogoVersion';
  v.textContent='v11.02';
  v.style.cssText='font-size:10px;line-height:1;text-align:center;letter-spacing:.08em;opacity:.65;color:#e6d6a8;margin-top:2px;';
  logo.insertAdjacentElement('afterend',v);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',placeVersionUnderLogo,{once:true});
 else placeVersionUnderLogo();
})();


// ==================== Clean Quest Log version text (v10.90) ====================
/* v10.90 — Definitively remove version text from Quest Log only */
(function(){
 function cleanQuestLogVersion(){
  document.querySelectorAll('*').forEach(function(el){
   if(el.children.length) return;
   var t=el.textContent||'';
   if(/Quest Log/i.test(t) && /v\d+\.\d+/i.test(t)){
    el.textContent=t.replace(/\s*(?:[·•—\-–:]\s*)?v\d+\.\d+/ig,'').trim();
   }
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',cleanQuestLogVersion,{once:true});
 else cleanQuestLogVersion();
 new MutationObserver(cleanQuestLogVersion).observe(document.documentElement,{subtree:true,childList:true,characterData:true});
})();


// ==================== Move version from Quest Log to beneath 3D logo (v10.90) ====================
/* v10.90 — Move version from welcome Quest Log entry to beneath 3D logo */
(function(){
 function fixVersionPlacement(){
  // Clean the actual welcome log entry, including dynamically generated text.
  document.querySelectorAll('*').forEach(function(el){
   if(el.children.length)return;
   var t=el.textContent||'';
   if(/Welcome to Bag of Dungeon 3D\s+v?\d+\.\d+/i.test(t)){
    el.textContent=t.replace(/Welcome to Bag of Dungeon 3D\s+v?\d+\.\d+\.?/i,'Welcome to Bag of Dungeon 3D.');
   }
  });

  if(document.getElementById('bodVersionUnderLogo'))return;

  // Locate the small literal 3D mark beneath the logo and append version there.
  var candidates=[].slice.call(document.querySelectorAll('div,span,p,h1,h2,h3,h4'));
  var mark=candidates.find(function(el){
   if(el.children.length)return false;
   var t=(el.textContent||'').replace(/\s+/g,'').trim().toUpperCase();
   if(t!=='3D')return false;
   var r=el.getBoundingClientRect();
   return r.left<600 && r.top<500 && r.width<250 && r.height<120;
  });
  if(mark){
   var v=document.createElement('div');
   v.id='bodVersionUnderLogo';
   v.textContent='v11.02';
   mark.insertAdjacentElement('afterend',v);
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fixVersionPlacement,{once:true});
 else fixVersionPlacement();
 new MutationObserver(fixVersionPlacement).observe(document.documentElement,{subtree:true,childList:true,characterData:true});
})();


// ==================== Dice ground-plane normaliser (v10.98) ====================
// v10.98 dice ground-plane normaliser: keeps every settled die on the same board surface.
(function(){
  window.BOD3D_DICE_DEFAULTS = Object.assign({}, window.BOD3D_DICE_DEFAULTS || {}, {
    duration:1050, dropHeight:2.5, bounce1:1, bounce2:0.02, bounce3:0.06, separation:0.55, spacing:0.9, floorOffset:0.03
  });
  function normaliseSettledDice(){
    try{
      const scene = window.scene || window.gameScene || window.threeScene;
      const THREEref = window.THREE;
      if(!scene || !THREEref) return;
      const dice=[];
      scene.traverse(o=>{
        const n=(o.name||'').toLowerCase();
        if(n.includes('dice') && o.visible && o.userData && (o.userData.isDice||o.userData.die||o.userData.diceType)) dice.push(o);
      });
      if(!dice.length) return;
      let boardY = null;
      // Prefer explicit shared plane values if the game exposes one.
      const candidates=[window.diceBoardY,window.tileTopY,window.boardSurfaceY,window.DICE_BOARD_Y];
      for(const v of candidates){ if(Number.isFinite(v)){ boardY=v; break; } }
      if(boardY===null){
        // Infer a common plane from the lowest current die bottoms, then use the minimum so none float above another.
        const bottoms=dice.map(d=>{ const box=new THREEref.Box3().setFromObject(d); return box.min.y; }).filter(Number.isFinite);
        if(!bottoms.length) return;
        boardY=Math.min(...bottoms)-0.2;
      }
      const targetBottom=boardY+0.2;
      dice.forEach(d=>{
        const box=new THREEref.Box3().setFromObject(d);
        if(!Number.isFinite(box.min.y)) return;
        d.position.y += (targetBottom-box.min.y);
      });
    }catch(e){ console.warn('Dice ground normaliser:',e); }
  }
  // Run after likely roll durations; repeated briefly to catch staggered multi-die settles.
  window.addEventListener('load',()=>{
    /* v10.99: disabled legacy interval normaliser; grounding is now exact per die at settle time. */
  });
})();


// ==================== Respawn camera timing globals ====================
window.RESPAWN_CAMERA_DELAY_MS=2000;
window.RESPAWN_CENTER_ON_START=true;


