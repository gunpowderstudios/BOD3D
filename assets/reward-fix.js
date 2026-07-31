// BOD3D — unique item deck, end-game music and cache-version loader
(function(){
  const BUILD=(document.currentScript&&new URL(document.currentScript.src,location.href).searchParams.get('v'))||'12.37';
  const VERSION='v'+BUILD;
  window.BOD3D_BUILD_VERSION=VERSION;
  function syncVersion(){document.title='Play Bag of Dungeon 3D Free Online | Gunpowder Studios';const visible=document.getElementById('visibleBuildVersion');if(visible)visible.textContent=VERSION;}
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
  function loadGameplayRules(){loadScriptOnce('script[data-bod-gameplay-rules-v1165]','assets/gameplay-rules-v1165.js?v=12.52','bodGameplayRulesV1165');}
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
    function returnToBag(item){if(!item||!state?.itemDeck)return;const index=Math.floor(Math.random()*(state.itemDeck.length+1));state.itemDeck.splice(index,0,item);}
    function chooseMonsterReward(items){
      const choose=(chosen,returned)=>{
        closeModal();
        returnToBag(returned);
        if(typeof log==='function')log('Chose '+chosen.name+'. '+returned.name+' goes back in the bag.','loot');
        rewardQueue.unshift({type:'item',item:chosen});
        setTimeout(deliverNext,80);
      };
      showModal(
        'Choose one item',
        '',
        items.map((item,index)=>({
          text:'Choose '+item.name,
          cls:'green',
          fn:()=>choose(item,items[index===0?1:0])
        }))
      );
      const body=document.getElementById('modalBody');
      if(body){
        body.innerHTML=
          '<div style="margin-bottom:14px">This powerful monster carried two items. Choose one—the other goes back in the bag.</div>'+
          '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;align-items:stretch">'+
          items.map(item=>
            '<div style="border:3px solid #1b1208;border-radius:8px;padding:10px 8px;background:rgba(255,255,255,.18);min-width:0">'+
              '<div style="font-size:42px;line-height:1;margin-bottom:7px">'+iconHTML(item.name,item.icon||'?')+'</div>'+
              '<div style="font-size:17px;font-weight:bold;line-height:1.15;margin-bottom:7px">'+item.name+'</div>'+
              '<div style="font-size:14px;line-height:1.25">'+(item.desc||'No special effect.')+'</div>'+
            '</div>'
          ).join('')+
          '</div>';
      }
    }
    function deliverNext(){
      if(!rewardQueue.length){delivering=false;return;}
      delivering=true;
      const task=rewardQueue.shift();
      if(task.type==='choice'){waitUntilReady(()=>chooseMonsterReward(task.items));return;}
      const item=task.item;
      const delivered=originalAwardItem(item);
      if(delivered===false&&typeof log==='function')log('Could not deliver '+item.name+'; continuing with remaining rewards.','system');
      waitUntilReady(()=>setTimeout(deliverNext,80));
    }
    window.queueMonsterRewards=function(count){
      const total=Math.max(0,Number(count)||0);
      const drawn=[];
      for(let i=0;i<total;i++){
        const item=drawItem();
        if(item)drawn.push(item);
        else if(typeof log==='function')log('No items left in the item deck.','system');
      }
      if(drawn.length===2&&total===2)rewardQueue.push({type:'choice',items:drawn});
      else drawn.forEach(item=>rewardQueue.push({type:'item',item}));
      if(!delivering&&rewardQueue.length)setTimeout(deliverNext,120);
    };
    awardItem=function(item){
      const drawn=item||drawItem();
      if(!drawn){if(typeof log==='function')log('No items left in the item deck.','system');return false;}
      rewardQueue.push({type:'item',item:drawn});
      if(!delivering)setTimeout(deliverNext,40);
      return true;
    };
    return true;
  }
  function loadAll(){syncVersion();loadWarningScrollStyles();loadDesktopHudStyles();loadDarkCombatStyles();loadDarkHudStyles();loadMobileActionFix();loadCombatItemsStyles();loadUiFixes();loadQuestLogColours();loadWarningScrollV1177();loadCarriedRingHud();loadBuyBod();loadLethalBlow();loadMobileSheetFix();loadCombatCleanup();loadCombatOnlyAP();loadCombatItemsMenu();loadCharactersOnly();loadEnterButtonFix();loadAudioLifecycle();loadGameplayRules();loadHealthHud();loadStoryIntro();}
  function start(){loadAll();if(installRewards())return;let attempts=0;const timer=setInterval(()=>{loadAll();if(installRewards()||++attempts>240)clearInterval(timer);},50);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  setTimeout(syncVersion,900);
})();
