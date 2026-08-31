// Bag of Dungeon 3D — interface behaviour
// Started in TEST v12.68 with the proven mobile character drawer behaviour.
// Additional UI patches will move here only after separate verification.

// Build version follows index.html so the visible label cannot overwrite newer releases.
(function(){
  const version=document.documentElement.dataset.buildVersion||'development';
  function sync(){
    document.documentElement.dataset.buildVersion=version;
    const visible=document.getElementById('visibleBuildVersion');
    if(visible)visible.textContent=version;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
  setTimeout(sync,500);
})();

// v13.45 — remove the stray desktop divider beside Special Ability and
// enlarge the small HEALTH / AP / COMBAT / SPECIAL ABILITY labels.
(function(){
  const style=document.createElement('style');
  style.id='bodHeroSelectPolishV1345';
  style.textContent=`
    .heroStat small,
    .heroSpecialBlock small{
      font-size:13px!important;
      line-height:1.05!important;
      letter-spacing:.08em!important;
      font-weight:800!important;
    }
    @media (min-width:901px){
      .heroSpecialBlock{
        border-left:0!important;
        padding-left:0!important;
      }
    }
    @media (max-width:900px){
      .heroStat small,
      .heroSpecialBlock small{
        font-size:12px!important;
      }
    }
  `;
  document.head.appendChild(style);
})();

// Mobile character drawer scroll/close behaviour
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

// Vertical health-heart HUD. On mobile, hide exploration hearts during combat.
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
    document.addEventListener('DOMContentLoaded', start, { once:true });
  } else {
    start();
  }
})();

// Start tile exploration/camera hint
(function(){
  if(window.__bodStartTileHintInstalled)return;
  window.__bodStartTileHintInstalled=true;
  let shownThisGame=false;

  function removeHint(){document.getElementById('bodTouchCameraHint')?.remove();}
  function showHint(){
    if(shownThisGame)return;
    shownThisGame=true;
    removeHint();
    const hint=document.createElement('div');
    hint.id='bodTouchCameraHint';
    hint.setAttribute('role','status');
    hint.style.cssText='position:absolute;left:50%;top:22%;transform:translateX(-50%);z-index:9999;max-width:min(88vw,500px);padding:10px 34px 10px 14px;background:rgba(0,0,0,.72);border:1px solid rgba(255,255,255,.35);border-radius:8px;color:#fff;font-size:16px;line-height:1.3;text-align:center;box-shadow:0 3px 12px rgba(0,0,0,.45);pointer-events:auto;';
    hint.innerHTML='<span>Lay tiles to explore, rotate, zoom, pan or click the map if you get lost. Good luck.</span><button type="button" aria-label="Close camera hint" style="position:absolute;right:5px;top:3px;width:28px;height:28px;border:0;background:transparent;color:#fff;font-size:22px;line-height:26px;cursor:pointer;padding:0;">×</button>';
    hint.querySelector('button')?.addEventListener('click',removeHint);
    const host=document.getElementById('viewport')||document.getElementById('threeBoard')||document.body;
    if(getComputedStyle(host).position==='static')host.style.position='relative';
    host.appendChild(hint);
  }

  function install(){
    if(typeof newGame!=='function')return false;
    const originalNewGame=newGame;
    newGame=function(){
      removeHint();
      shownThisGame=false;
      const result=originalNewGame.apply(this,arguments);
      setTimeout(showHint,250);
      return result;
    };
    return true;
  }

  if(!install()){
    let tries=0;
    const timer=setInterval(()=>{if(install()||++tries>200)clearInterval(timer);},50);
  }
})();

// Match TEST: plain white intro/end text on black.
(function(){
  if(document.getElementById('bodPlainStoryPanels'))return;
  const style=document.createElement('style');
  style.id='bodPlainStoryPanels';
  style.textContent=`
    #modal.introScrollModal .card:has(.testerWarningScroll),
    #modal.endingScrollModal .card{
      width:min(760px,calc(100vw - 30px))!important;
      max-width:760px!important;
      height:auto!important;
      max-height:min(82dvh,760px)!important;
      aspect-ratio:auto!important;
      padding:28px 30px 24px!important;
      border:1px solid rgba(255,255,255,.65)!important;
      border-radius:6px!important;
      background:#000!important;
      background-image:none!important;
      box-shadow:0 12px 36px rgba(0,0,0,.72)!important;
      color:#fff!important;
      overflow:auto!important;
    }
    #modal.introScrollModal .testerWarningScroll,
    #modal.endingScrollModal #modalBody,
    #modal.endingScrollModal #modalBody *{
      background:transparent!important;
      color:#fff!important;
      font-family:"Alegreya Sans",Arial,sans-serif!important;
      text-shadow:none!important;
    }
    #modal.introScrollModal .testerWarningScroll{
      height:auto!important;
      min-height:0!important;
      padding:0!important;
      color:#fff!important;
      overflow:auto!important;
    }
    #modal.introScrollModal .testerWarningScroll>div:first-child{
      color:#fff!important;
    }
    #modal.introScrollModal .card:has(.testerWarningScroll)>#modalButtons,
    #modal.endingScrollModal #modalButtons{
      position:static!important;
      transform:none!important;
      width:100%!important;
      margin-top:18px!important;
      padding:0!important;
    }
    @media(max-width:900px){
      #modal.introScrollModal .card:has(.testerWarningScroll),
      #modal.endingScrollModal .card{
        width:calc(100vw - 20px)!important;
        max-height:calc(100dvh - 20px)!important;
        padding:22px 18px 18px!important;
      }
    }
  `;
  document.head.appendChild(style);
})();

// Intro choice: players can enter immediately or continue reading the short story.
(function(){
  if(window.__bodInlineDungeonEntryInstalled)return;
  window.__bodInlineDungeonEntryInstalled=true;

  const style=document.createElement('style');
  style.id='bodInlineDungeonEntryStyles';
  style.textContent=`
    #modal.introScrollModal #modalButtons{display:none!important;}
    .testerWarningScroll .introEnterDungeonButton{
      display:block;width:100%;margin:20px 0 26px;padding:13px 18px;
      border:2px solid #fff;border-radius:4px;background:#000;color:#fff;
      box-shadow:none;font-size:20px;line-height:1.15;font-weight:800;
      text-align:center;cursor:pointer;
    }
    .testerWarningScroll .introEnterDungeonButton:hover,
    .testerWarningScroll .introEnterDungeonButton:focus-visible{background:#fff;color:#000;}
  `;
  document.head.appendChild(style);

  function installButton(){
    const modal=document.getElementById('modal');
    if(!modal?.classList.contains('introScrollModal'))return;
    const scroll=modal.querySelector('.testerWarningScroll');
    if(!scroll||scroll.querySelector('.introEnterDungeonButton'))return;
    const storyHeading=scroll.querySelector('.testerStoryHeading');
    if(!storyHeading)return;
    const button=document.createElement('button');
    button.type='button';
    button.className='introEnterDungeonButton';
    button.textContent='Enter the Dungeon';
    button.setAttribute('aria-label','Enter the Dungeon and skip the short story');
    button.addEventListener('click',()=>{
      if(typeof closeModal==='function')closeModal();
      else modal.classList.remove('open');
    });
    storyHeading.before(button);
  }

  function start(){
    installButton();
    new MutationObserver(installButton).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
