// Bag of Dungeon 3D — small UI/audio patch scripts.
// Split out of index.html for easier editing. Each patch below is a self-contained IIFE
// (or, for the last one, simple globals) and can be edited independently of the rest.

// ==================== Logo load fallback (v10.58) ====================
(function(){
 const logo=document.getElementById('heroSelectLogo');
 if(!logo)return;
 const candidates=['./assets/ui/bod3d-logo.png?v=10.58','assets/ui/bod3d-logo.png?v=10.58'];
 let candidateIndex=0;
 logo.addEventListener('load',()=>{console.info('BOD3D logo loaded:',logo.currentSrc||logo.src);});
 logo.addEventListener('error',()=>{candidateIndex++;if(candidateIndex<candidates.length){console.warn('BOD3D logo failed; trying:',candidates[candidateIndex]);logo.src=candidates[candidateIndex];}else{console.error('BOD3D logo could not be found. Expected GitHub file: assets/ui/bod3d-logo.png');logo.style.display='none';}});
})();

// ==================== Fullscreen control (v11.20) ====================
(function(){
 const buttons=[...document.querySelectorAll('.fullscreenControl')];if(!buttons.length)return;
 const fullscreenElement=()=>document.fullscreenElement||document.webkitFullscreenElement;
 const toggleFullscreen=async()=>{try{if(fullscreenElement()){if(document.exitFullscreen)await document.exitFullscreen();else if(document.webkitExitFullscreen)document.webkitExitFullscreen();}else{const root=document.documentElement;if(root.requestFullscreen)await root.requestFullscreen();else if(root.webkitRequestFullscreen)root.webkitRequestFullscreen();else toast('Full screen is not supported by this browser.');}}catch(error){console.warn('Full screen request failed:',error);}};
 buttons.forEach(button=>button.addEventListener('click',toggleFullscreen));
 const fullscreenIcon=active=>active?'<svg class="controlIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4m11-5v5h5M9 20v-5H4m11 5v-5h5"/></svg>':'<svg class="controlIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4H4v5m11-5h5v5M9 20H4v-5m11 5h5v-5"/></svg>';
 const syncFullscreenButtons=()=>{const active=!!fullscreenElement();buttons.forEach(button=>{button.innerHTML=fullscreenIcon(active);button.title=active?'Exit full screen (or press Esc)':'Full screen — press Esc to exit';button.setAttribute('aria-label',active?'Exit full screen':'Enter full screen');});};
 document.addEventListener('fullscreenchange',syncFullscreenButtons);document.addEventListener('webkitfullscreenchange',syncFullscreenButtons);syncFullscreenButtons();
})();

// ==================== Smooth hero-follow camera manual-override grace period (v10.67) ====================
(function(){
 let manualCameraUntil=0;const MANUAL_GRACE_MS=1800;const markManual=()=>{manualCameraUntil=performance.now()+MANUAL_GRACE_MS;};
 ['wheel','pointerdown','touchstart'].forEach(type=>{window.addEventListener(type,e=>{const t=e.target;if(t&&(t.closest?.('#viewport')||t.closest?.('#threeBoard')||t.closest?.('#zoomIn')||t.closest?.('#zoomOut')||t.closest?.('#centreBtn')||t.closest?.('#viewBtn')||t.closest?.('#compass')))markManual();},{passive:true,capture:true});});
 const install=()=>{if(typeof window.renderBoard!=='function'||window.__bodHeroFollowInstalled)return false;window.__bodHeroFollowInstalled=true;const original=window.renderBoard;window.renderBoard=async function(state){const result=await original.apply(this,arguments);try{if(!state||!state.player)return result;if(document.body.classList.contains('combatActive'))return result;if(performance.now()<manualCameraUntil)return result;const centre=window.centreCameraOnHero||(typeof centreCameraOnHero==='function'?centreCameraOnHero:null);if(typeof centre==='function'){const world=document.getElementById('world');if(world)world.classList.add('cameraSmooth');centre();setTimeout(()=>world&&world.classList.remove('cameraSmooth'),360);}}catch(e){console.warn('Hero follow camera:',e);}return result;};return true;};
 if(!install()){let tries=0;const timer=setInterval(()=>{if(install()||++tries>80)clearInterval(timer);},50);}
})();

// ==================== Hide mystery counters (v10.90) ====================
(function(){function hideMysteryCounters(){document.querySelectorAll('button,div,span').forEach(function(el){var t=(el.textContent||'').trim();if(/^(Tiles|Monsters|Items)\s+\d+$/.test(t)&&el.children.length===0)el.style.setProperty('display','none','important');});}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hideMysteryCounters,{once:true});else hideMysteryCounters();new MutationObserver(hideMysteryCounters).observe(document.documentElement,{subtree:true,childList:true,characterData:true});})();

// ==================== Version placement under logo ====================
(function(){function placeVersionUnderLogo(){if(document.getElementById('visibleBuildVersion')||document.getElementById('topLogoVersion'))return;const imgs=[...document.querySelectorAll('img')];const logo=imgs.find(img=>/bod3d-logo|bod3d_logo|logo/i.test((img.getAttribute('src')||'')));if(!logo)return;const known=logo.closest('#logoWrap,#gameLogoWrap,.logoWrap,.gameLogoWrap,.topLogo,.brandLogo');if(known)return;const v=document.createElement('div');v.id='topLogoVersion';v.textContent='v11.02';v.style.cssText='font-size:10px;line-height:1;text-align:center;letter-spacing:.08em;opacity:.65;color:#e6d6a8;margin-top:2px;';logo.insertAdjacentElement('afterend',v);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',placeVersionUnderLogo,{once:true});else placeVersionUnderLogo();})();

// ==================== Clean Quest Log version text (v10.90) ====================
(function(){function cleanQuestLogVersion(){document.querySelectorAll('*').forEach(function(el){if(el.children.length)return;var t=el.textContent||'';if(/Quest Log/i.test(t)&&/v\d+\.\d+/i.test(t))el.textContent=t.replace(/\s*(?:[·•—\-–:]\s*)?v\d+\.\d+/ig,'').trim();});}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',cleanQuestLogVersion,{once:true});else cleanQuestLogVersion();new MutationObserver(cleanQuestLogVersion).observe(document.documentElement,{subtree:true,childList:true,characterData:true});})();

// ==================== Move version from Quest Log to beneath 3D logo (v10.90) ====================
(function(){function fixVersionPlacement(){if(document.getElementById('visibleBuildVersion'))return;document.querySelectorAll('*').forEach(function(el){if(el.children.length)return;var t=el.textContent||'';if(/Welcome to Bag of Dungeon 3D\s+v?\d+\.\d+/i.test(t))el.textContent=t.replace(/Welcome to Bag of Dungeon 3D\s+v?\d+\.\d+\.?/i,'Welcome to Bag of Dungeon 3D.');});if(document.getElementById('bodVersionUnderLogo'))return;var candidates=[].slice.call(document.querySelectorAll('div,span,p,h1,h2,h3,h4'));var mark=candidates.find(function(el){if(el.children.length)return false;var t=(el.textContent||'').replace(/\s+/g,'').trim().toUpperCase();if(t!=='3D')return false;var r=el.getBoundingClientRect();return r.left<600&&r.top<500&&r.width<250&&r.height<120;});if(mark){var v=document.createElement('div');v.id='bodVersionUnderLogo';v.textContent='v11.02';mark.insertAdjacentElement('afterend',v);}}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fixVersionPlacement,{once:true});else fixVersionPlacement();new MutationObserver(fixVersionPlacement).observe(document.documentElement,{subtree:true,childList:true,characterData:true});})();

// ==================== Dice ground-plane normaliser (v10.98) ====================
(function(){window.BOD3D_DICE_DEFAULTS=Object.assign({},window.BOD3D_DICE_DEFAULTS||{},{duration:1050,dropHeight:2.5,bounce1:1,bounce2:0.02,bounce3:0.06,separation:0.55,spacing:0.9,floorOffset:0.03});})();

// ==================== Respawn camera timing globals ====================
window.RESPAWN_CAMERA_DELAY_MS=2000;window.RESPAWN_CENTER_ON_START=true;

// ==================== Victory Quest Log (v13.39) ====================
(function(){
 function showVictoryEnding(rescuedFirkin){showModal('YOU ESCAPED!','',[{text:'Quest Log',fn:()=>showVictoryQuestLog(rescuedFirkin)},{text:'New Game',cls:'green',fn:()=>{window.stopEndGameMusic?.();showCharSelect();}}]);document.getElementById('modal')?.classList.add('endingScrollModal');const body=document.getElementById('modalBody');if(body){body.innerHTML=endingScrollHTML(rescuedFirkin);body.scrollTop=0;}}
 function showVictoryQuestLog(rescuedFirkin){showModal('QUEST LOG','',[{text:'Back to Ending',fn:()=>showVictoryEnding(rescuedFirkin)},{text:'New Game',cls:'green',fn:()=>{window.stopEndGameMusic?.();showCharSelect();}}]);const modal=document.getElementById('modal');modal?.classList.remove('modalEdge','endingScrollModal');modal?.classList.add('questLogModal');const body=document.getElementById('modalBody');if(body){const html=typeof questLogEntriesHTML==='function'?questLogEntriesHTML():'';body.innerHTML='<div id="questLogViewer" style="height:100%;overflow-y:auto;-webkit-overflow-scrolling:touch;background:#080808;border:3px solid #1b1208;border-radius:8px;padding:10px;text-align:left;font-size:15px;line-height:1.35">'+(html||'<div style="color:#fff">No quest entries recorded.</div>')+'</div>';const scroller=document.getElementById('questLogViewer');if(scroller)scroller.scrollTop=scroller.scrollHeight;}}
 win=function(){state.gameOver=true;sndWin();closeCombat();window.startEndGameMusic?.();showVictoryEnding(!!state.player.companionFirkin);};
})();

// ==================== ACME Insurance keeps carried items (v13.40) ====================
(function(){
 const acmeItem=typeof ITEM_MASTER!=='undefined'?ITEM_MASTER.find(item=>item.name==='Acme Insurance'):null;if(acmeItem)acmeItem.desc='Used automatically on defeat: gain another life and return to the Start.';
 if(typeof death!=='function'||window.__bodAcmeKeepItemsInstalled)return;window.__bodAcmeKeepItemsInstalled=true;const originalDeath=death;
 death=function(){const p=state?.player;if(!p)return originalDeath.apply(this,arguments);const carried=allCarriedItems();const acme=carried.find(item=>item.name==='Acme Insurance');const insured=Boolean(acme||p.flags?.insurance);if(!insured)return originalDeath.apply(this,arguments);window.BODDice3D?.clear?.();if(acme){removeFromCurrentLocation(acme);state.itemDiscard.push(acme);}if(p.flags)p.flags.insurance=false;state.lastDeath=null;log('ACME Insurance grants you another life and returns you to Start. You keep all carried items.','heal');returnHeroToStart(p);showModal('ACME INSURANCE PAYS OUT!','You gain another life and return to the Start with full Health and AP. You keep all your carried items.',[{text:'Return to the Dungeon',cls:'green',fn:closeModal}]);};
})();

// ==================== Healing Pool after 20 laid tiles (v13.41) ====================
(function(){
 if(typeof createTileDeck!=='function'||window.__bodHealingPool20TileRule)return;
 window.__bodHealingPool20TileRule=true;
 const originalCreateTileDeck=createTileDeck;
 createTileDeck=function(){
  const deck=originalCreateTileDeck.apply(this,arguments);
  const poolIndex=deck.findIndex(tile=>tile?.kind==='pool');
  if(poolIndex<0)return deck;
  // Tiles are drawn with pop(), so the final 20 array entries are the first 20 laid.
  // Keep the Healing Pool outside that zone. Index 0 remains the reserved final Exit.
  const latestAllowedIndex=deck.length-21;
  if(poolIndex>latestAllowedIndex){
   const candidates=[];
   for(let i=1;i<=latestAllowedIndex;i++){
    if(deck[i]?.kind!=='pool'&&deck[i]?.kind!=='exit')candidates.push(i);
   }
   if(candidates.length){
    const swapIndex=candidates[Math.floor(Math.random()*candidates.length)];
    [deck[poolIndex],deck[swapIndex]]=[deck[swapIndex],deck[poolIndex]];
   }
  }
  return deck;
 };
})();

// ==================== Larger desktop sidebar logo (v13.42) ====================
(function(){
 const style=document.createElement('style');
 style.id='bodDesktopSidebarLogoV1342';
 style.textContent='@media (min-width:901px){#brandHeader .brandLogo,#brandHeader img{width:80%!important;max-width:none!important;max-height:none!important;height:auto!important;object-fit:contain!important;margin:2px auto 8px!important;}}';
 document.head.appendChild(style);
})();

// ==================== Compact hero select + desktop radio (v13.43) ====================
(function(){
 const style=document.createElement('style');
 style.id='bodHeroSelectCompactV1343';
 style.textContent=`
@media (min-width:901px){
  .heroInfoPanel{
    width:min(960px,82vw)!important;
    margin-top:-6px!important;
    padding:8px 18px 10px!important;
    display:grid!important;
    grid-template-columns:minmax(390px,1.45fr) minmax(250px,.9fr) 190px!important;
    grid-template-areas:"title title title" "desc desc desc" "stats special button"!important;
    column-gap:18px!important;
    row-gap:3px!important;
    align-items:center!important;
  }
  .heroInfoPanel h1{grid-area:title!important;font-size:clamp(28px,2.2vw,36px)!important;line-height:1!important;margin:0!important}
  .selectedHeroDesc{grid-area:desc!important;font-size:clamp(15px,1.15vw,18px)!important;line-height:1.1!important;margin:0 0 4px!important}
  .heroStatRow{grid-area:stats!important;margin:0!important;padding:5px 0!important;gap:4px!important}
  .heroStat strong{font-size:clamp(21px,1.7vw,27px)!important}
  .heroStat small{font-size:10px!important}
  .heroSpecialBlock{grid-area:special!important;margin:0!important;padding:2px 0 2px 18px!important;border-left:1px solid rgba(255,255,255,.6)!important}
  .heroSpecialBlock small{font-size:10px!important}
  .heroSpecialBlock strong{font-size:clamp(19px,1.55vw,24px)!important}
  .heroSpecialBlock span{font-size:clamp(13px,1.05vw,16px)!important;line-height:1.12!important}
  .chooseHeroBtn{grid-area:button!important;margin:0!important;min-height:54px!important;padding:8px 14px!important;font-size:16px!important}
  #desktopDungeonRadio{
    position:fixed!important;
    right:152px!important;
    bottom:18px!important;
    z-index:560!important;
    width:min(360px,30vw)!important;
    min-width:300px!important;
    min-height:66px!important;
    padding:7px 8px!important;
    display:grid!important;
    grid-template-columns:42px minmax(0,1fr) 42px!important;
    gap:7px!important;
    align-items:center!important;
    background:rgba(0,0,0,.92)!important;
    border:1px solid rgba(255,255,255,.7)!important;
    color:#fff!important;
    box-shadow:0 6px 18px rgba(0,0,0,.55)!important;
    text-align:center!important;
    pointer-events:auto!important;
  }
  #desktopDungeonRadio[hidden]{display:none!important}
  #desktopDungeonRadio .desktopRadioSkip{
    width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;
    margin:0!important;padding:0!important;border:0!important;background:transparent!important;color:#fff!important;
    box-shadow:none!important;font-size:18px!important;line-height:1!important;
  }
  #desktopDungeonRadio .desktopRadioSkip:hover{background:transparent!important;opacity:.72!important}
  .desktopRadioText{min-width:0!important;color:#fff!important;line-height:1.08!important}
  .desktopRadioTitle{color:#e32636!important;font:900 13px/1 "Alegreya Sans",Arial,sans-serif!important;letter-spacing:.06em!important;margin-bottom:3px!important}
  .desktopRadioNow{color:#fff!important;font-size:12px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
  .desktopRadioArtist{color:#fff!important;font-size:11px!important;margin-top:3px!important;opacity:.9!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
}
@media (min-width:901px) and (max-width:1120px){
  #desktopDungeonRadio{right:130px!important;width:300px!important;min-width:280px!important}
  .heroInfoPanel{width:min(900px,88vw)!important;grid-template-columns:minmax(350px,1.35fr) minmax(220px,.85fr) 170px!important}
}
@media (max-width:900px){#desktopDungeonRadio{display:none!important}}
`;
 document.head.appendChild(style);
})();
