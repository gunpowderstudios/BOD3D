// Bag of Dungeon 3D — interface behaviour
// Started in TEST v12.68 with the proven mobile character drawer behaviour.
// Additional UI patches will move here only after separate verification.

// Live v13.44 — mobile combat heart visibility fix promoted from TEST.
(function(){
  const version='v13.44';
  function sync(){
    document.documentElement.dataset.buildVersion=version;
    const visible=document.getElementById('visibleBuildVersion');
    if(visible)visible.textContent=version;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
  setTimeout(sync,500);
})();

// BOD3D-TEST v11.41 — mobile character drawer scroll/close behaviour
(function(){
  function install(){
    const sheet=document.getElementById('side');
    const toggle=document.getElementById('mobileSheetToggle');
    if(!sheet||!toggle)return false;
    if(sheet.dataset.buttonCloseOnly==='1')return true;
    sheet.dataset.buttonCloseOnly='1';

    const insideToggle=target=>!!target?.closest?.('#mobileSheetToggle');
    const stopDismissGesture=event=>{
      if(insideToggle(event.target))return;
      if(!sheet.classList.contains('mobileExpanded'))return;
      event.stopPropagation();
    };

    ['touchstart','touchmove','touchend','touchcancel'].forEach(type=>{
      sheet.addEventListener(type,stopDismissGesture,{capture:true,passive:true});
    });
    ['pointerdown','pointermove','pointerup','pointercancel'].forEach(type=>{
      sheet.addEventListener(type,event=>{
        if(event.pointerType==='touch')stopDismissGesture(event);
      },{capture:true,passive:true});
    });

    const syncLabel=()=>{
      const expanded=sheet.classList.contains('mobileExpanded');
      toggle.setAttribute('aria-expanded',expanded?'true':'false');
      toggle.setAttribute('aria-label',expanded?'Close character menu':'Open character menu');
      toggle.title=expanded?'Close character menu':'Open character menu';
    };
    new MutationObserver(syncLabel).observe(sheet,{attributes:true,attributeFilter:['class']});
    syncLabel();

    const style=document.createElement('style');
    style.id='bodMobileSheetButtonOnlyStyles';
    style.textContent=`
      @media(max-width:800px){
        #side{
          overflow-y:auto!important;
          overflow-x:hidden!important;
          -webkit-overflow-scrolling:touch!important;
          overscroll-behavior:contain!important;
          touch-action:pan-y!important;
          scroll-behavior:smooth;
        }
        #side.mobileExpanded{max-height:82dvh!important;}
        #side #mobileSheetToggle{
          position:sticky!important;
          top:0!important;
          z-index:30!important;
          touch-action:manipulation!important;
        }
        #side.mobileExpanded #mobileSheetToggle::after{
          content:'  Close';
          font-size:13px;
        }
      }
    `;
    document.head.appendChild(style);
    return true;
  }

  function start(){
    if(install())return;
    let tries=0;
    const timer=setInterval(()=>{if(install()||++tries>200)clearInterval(timer);},50);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

// Consolidated in TEST v12.73: vertical health-heart HUD for desktop and mobile.
// Live v13.44: mobile exploration hearts are hidden whenever combatActive is present.
(function () {
  'use strict';

  if (window.__bodHealthHudV1171Installed) return;
  window.__bodHealthHudV1171Installed = true;

  const combatStyle=document.createElement('style');
  combatStyle.id='bodMobileCombatHeartHideV1344';
  combatStyle.textContent='@media(max-width:800px){body.combatActive #livesHud{display:none!important;}}';
  document.head.appendChild(combatStyle);

  function ensureHud() {
    const main = document.getElementById('main');
    if (!main) return null;
    let hud = document.getElementById('livesHud');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'livesHud';
      hud.setAttribute('aria-live', 'polite');
      main.appendChild(hud);
    }
    return hud;
  }

  function update() {
    const hud = ensureHud();
    if (!hud) return;
    if (typeof state === 'undefined' || !state?.player) {
      hud.style.display = 'none';
      return;
    }

    const mobileCombat = window.matchMedia('(max-width: 800px)').matches &&
      document.body.classList.contains('combatActive');
    if (mobileCombat) {
      hud.style.setProperty('display','none','important');
      return;
    }

    hud.style.removeProperty('display');
    const health = Math.max(0, Math.floor(Number(state.player.health) || 0));
    const maximum = Math.max(health, Math.floor(Number(state.player.maxHealth) || health));
    const signature = health + '/' + maximum;
    if (hud.dataset.healthSignature === signature) return;

    hud.dataset.healthSignature = signature;
    hud.innerHTML = Array.from({ length: maximum }, (_, index) =>
      '<span class="lifeHeart' + (index < health ? '' : ' emptyHeart') +
      '" aria-hidden="true">♥</span>'
    ).join('');
    hud.setAttribute('aria-label', health + ' of ' + maximum + ' health remaining');
  }

  function start() {
    update();
    setInterval(update, 100);
    new MutationObserver(update).observe(document.body,{attributes:true,attributeFilter:['class']});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
