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
      const buttons=[...document.querySelectorAll('.fullscreenControl')];
      if(!buttons.length)return;
      const fullscreenElement=()=>document.fullscreenElement||document.webkitFullscreenElement;
      const toggleFullscreen=async()=>{
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
      };
      buttons.forEach(button=>button.addEventListener('click',toggleFullscreen));
      const fullscreenIcon=active=>active
        ? '<svg class="controlIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4m11-5v5h5M9 20v-5H4m11 5v-5h5"/></svg>'
        : '<svg class="controlIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4H4v5m11-5h5v5M9 20H4v-5m11 5h5v-5"/></svg>';
      const syncFullscreenButtons=()=>{
        const active=!!fullscreenElement();
        buttons.forEach(button=>{
          button.innerHTML=fullscreenIcon(active);
          button.title=active?'Exit full screen (or press Esc)':'Full screen — press Esc to exit';
          button.setAttribute('aria-label',active?'Exit full screen':'Enter full screen');
        });
      };
      document.addEventListener('fullscreenchange',syncFullscreenButtons);
      document.addEventListener('webkitfullscreenchange',syncFullscreenButtons);
      syncFullscreenButtons();
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
  if(document.getElementById('visibleBuildVersion'))return;
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
  if(document.getElementById('visibleBuildVersion'))return;
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


