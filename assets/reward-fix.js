// BOD3D-TEST v12.19 — black Enter the Dungeon hover text
(function(){
  const BUILD='12.19';
  const VERSION='v'+BUILD;
  window.BOD3D_BUILD_VERSION=VERSION;
  function syncVersion(){document.title='Bag of Dungeon 3D '+VERSION;const visible=document.getElementById('visibleBuildVersion');if(visible)visible.textContent=VERSION;}
  function versioned(path){return path+(path.includes('?')?'&':'?')+'v='+BUILD;}
  function reportLoadFailure(path){
    console.error('[BOD3D '+VERSION+'] Required patch failed to load:',path);
    if(document.getElementById('bodStartupWarning'))return;
    const warning=document.createElement('div');
    warning.id='bodStartupWarning';
    warning.textContent='BOD3D could not load an essential update. Please refresh the page.';
    warning.style.cssText='position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:99999;max-width:min(92vw,680px);padding:10px 16px;background:#a30f19;color:#fff;border:2px solid #fff;font:700 15px/1.25 Arial,sans-serif;text-align:center;box-shadow:0 3px 14px #000;';
    (document.body||document.documentElement).appendChild(warning);
  }
  function loadScriptOnce(selector,path,datasetName){if(document.querySelector(selector))return;const script=document.createElement('script');script.src=versioned(path);script.dataset[datasetName]='1';script.onerror=()=>reportLoadFailure(path);document.head.appendChild(script);}
  function loadStyleOnce(selector,path,datasetName){if(document.querySelector(selector))return;const link=document.createElement('link');link.rel='stylesheet';link.href=versioned(path);link.dataset[datasetName]='1';link.onerror=()=>reportLoadFailure(path);document.head.appendChild(link);}
  function loadLethalBlow(){loadScriptOnce('script[data-bod-lethal-blow]','assets/lethal-blow.js','bodLethalBlow');}
  function loadMobileSheetFix(){loadScriptOnce('script[data-bod-mobile-sheet-fix]','assets/mobile-sheet-fix.js','bodMobileSheetFix');}
  function loadCombatCleanup(){loadScriptOnce('script[data-bod-combat-cleanup]','assets/combat-cleanup.js','bodCombatCleanup');}
  function loadCombatOnlyAP(){loadScriptOnce('script[data-bod-combat-only-ap]','assets/ap-combat-only.js','bodCombatOnlyAp');}
  function loadCombatItemsMenu(){loadScriptOnce('script[data-bod-combat-items-menu]','assets/combat-items-menu.js','bodCombatItemsMenu');}
  function loadCharactersOnly(){loadScriptOnce('script[data-bod-characters-only]','assets/characters-only.js','bodCharactersOnly');}
  function loadAudioLifecycle(){loadScriptOnce('script[data-bod-audio-lifecycle]','assets/audio-lifecycle.js','bodAudioLifecycle');}
  function loadGameplayRules(){loadScriptOnce('script[data-bod-gameplay-rules-v1165]','assets/gameplay-rules-v1165.js','bodGameplayRulesV1165');}
  function loadHealthHud(){loadScriptOnce('script[data-bod-health-hud]','assets/health-hud.js','bodHealthHud');}
  function loadStoryIntro(){loadScriptOnce('script[data-bod-story-intro]','assets/story-intro.js','bodStoryIntro');}
  function loadWarningScrollStyles(){loadStyleOnce('link[data-bod-warning-scroll]','css/warning-scroll.css','bodWarningScroll');}
  function loadDesktopHudStyles(){loadStyleOnce('link[data-bod-desktop-hud]','css/desktop-hud.css','bodDesktopHud');}
  function loadDarkCombatStyles(){loadStyleOnce('link[data-bod-dark-combat]','css/dark-combat.css','bodDarkCombat');}
  function loadDarkHudStyles(){loadStyleOnce('link[data-bod-dark-hud]','css/dark-hud.css','bodDarkHud');}
  function loadMobileActionFix(){loadStyleOnce('link[data-bod-mobile-action-fix]','css/mobile-action-fix.css','bodMobileActionFix');}
  function loadEnterButtonFix(){loadStyleOnce('link[data-bod-enter-button-fix]','css/enter-button-fix.css','bodEnterButtonFix');}
  function loadCombatItemsStyles(){loadStyleOnce('link[data-bod-combat-items-menu]','css/combat-items-menu.css','bodCombatItemsMenu');}
  function loadUiFixes(){loadStyleOnce('link[data-bod-ui-fixes-v1168]','css/ui-fixes-v1168.css','bodUiFixesV1168');}
  function loadQuestLogColours(){loadStyleOnce('link[data-bod-quest-log-colours]','css/quest-log-colours.css','bodQuestLogColours');}
  function loadWarningScrollV1177(){loadStyleOnce('link[data-bod-warning-scroll-v1177]','css/warning-scroll-v1177.css','bodWarningScrollV1177');}
  function loadCarriedRingHud(){loadStyleOnce('link[data-bod-carried-ring-hud]','css/carried-ring-hud.css','bodCarriedRingHud');}
  function loadBuyBod(){loadStyleOnce('link[data-bod-buy-bod]','css/buy-bod.css','bodBuyBod');}
  function installRewards(){
    if(window.__bodSequentialRewardsInstalled)return true;
    if(typeof awardItem!=='function'||typeof drawItem!=='function')return false;
    window.__bodSequentialRewardsInstalled=true;
    const originalAwardItem=awardItem;const rewardQueue=[];let delivering=false;
    function modalBusy(){const modal=document.getElementById('modal');return !!(modal&&modal.classList.contains('open'));}
    function inventoryBusy(){return typeof pendingItemQueue!=='undefined'&&Array.isArray(pendingItemQueue)&&pendingItemQueue.length>0;}
    function waitUntilReady(callback){let attempts=0;const timer=setInterval(()=>{if((!modalBusy()&&!inventoryBusy())||++attempts>1200){clearInterval(timer);callback();}},50);}
    function deliverNext(){if(!rewardQueue.length){delivering=false;return;}delivering=true;const item=rewardQueue.shift();const delivered=originalAwardItem(item);if(delivered===false&&typeof log==='function')log('Could not deliver '+item.name+'; continuing with remaining rewards.','system');waitUntilReady(()=>setTimeout(deliverNext,80));}
    window.queueMonsterRewards=function(count){const total=Math.max(0,Number(count)||0);for(let i=0;i<total;i++){const item=drawItem();if(item)rewardQueue.push(item);else if(typeof log==='function')log('No items left in the item deck.','system');}if(!delivering&&rewardQueue.length)setTimeout(deliverNext,120);};
    awardItem=function(item){const drawn=item||drawItem();if(!drawn){if(typeof log==='function')log('No items left in the item deck.','system');return false;}rewardQueue.push(drawn);if(!delivering)setTimeout(deliverNext,40);return true;};
    return true;
  }
  function loadAll(){syncVersion();loadWarningScrollStyles();loadDesktopHudStyles();loadDarkCombatStyles();loadDarkHudStyles();loadMobileActionFix();loadCombatItemsStyles();loadUiFixes();loadQuestLogColours();loadWarningScrollV1177();loadCarriedRingHud();loadBuyBod();loadLethalBlow();loadMobileSheetFix();loadCombatCleanup();loadCombatOnlyAP();loadCombatItemsMenu();loadCharactersOnly();loadEnterButtonFix();loadAudioLifecycle();loadGameplayRules();loadHealthHud();loadStoryIntro();}
  function start(){loadAll();if(installRewards())return;let attempts=0;const timer=setInterval(()=>{loadAll();if(installRewards()||++attempts>240)clearInterval(timer);},50);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  setTimeout(syncVersion,900);
})();
