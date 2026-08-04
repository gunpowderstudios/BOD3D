// Bag of Dungeon 3D — Google Analytics gameplay events
// Observes existing game actions without changing any gameplay rules.
(function initialiseBODAnalytics(){
  'use strict';

  if(window.BODAnalytics?.initialised)return;

  const environment=location.pathname.toUpperCase().includes('/BOD3D-TEST')?'test':'live';

  function clean(value){
    if(value===undefined||value===null)return undefined;
    if(typeof value==='boolean')return value?'yes':'no';
    return value;
  }

  function track(eventName,parameters={}){
    if(typeof window.gtag!=='function')return;
    const payload={game_environment:environment};
    Object.entries(parameters).forEach(([key,value])=>{
      const cleaned=clean(value);
      if(cleaned!==undefined)payload[key]=cleaned;
    });
    window.gtag('event',eventName,payload);
  }

  function currentState(){
    try{return state||null;}catch(error){return null;}
  }

  function currentCombat(){
    try{return combat||null;}catch(error){return null;}
  }

  function elapsedSeconds(){
    const started=currentState()?.startedAt;
    return started?Math.max(0,Math.round((Date.now()-started)/1000)):0;
  }

  function exploredTiles(){
    return Object.values(currentState()?.tiles||{}).filter(tile=>tile?.visited).length;
  }

  function wrap(name,before){
    const original=window[name];
    if(typeof original!=='function'||original.__bodAnalyticsWrapped)return;
    function wrapped(){
      try{before.apply(this,arguments);}catch(error){console.warn('BOD3D analytics event failed:',name,error);}
      return original.apply(this,arguments);
    }
    wrapped.__bodAnalyticsWrapped=true;
    window[name]=wrapped;
  }

  window.BODAnalytics={initialised:true,track,environment};

  wrap('startGame',function(character){
    const heroId=character?.id||'unknown';
    const heroName=character?.name||'Unknown adventurer';
    track('character_selected',{character_id:heroId,character_name:heroName});
    track('game_start',{character_id:heroId,character_name:heroName});
  });

  wrap('openCombat',function(tile,options={}){
    const monster=tile?.monster;
    if(!monster)return;
    track('combat_started',{
      monster_name:monster.name,
      is_dragon:!!monster.isDragon,
      combat_type:options.rangedEngagement?'ranged_charge':'melee',
      no_escape:!!options.noEscape
    });
  });

  wrap('killMonster',function(){
    const monster=currentCombat()?.tile?.monster;
    if(!monster)return;
    const details={
      monster_name:monster.name,
      is_dragon:!!monster.isDragon,
      total_kills:(window.state?.player?.killed?.length||0)+1
    };
    track('monster_defeated',details);
    if(monster.isDragon)track('dragon_defeated',details);
  });

  wrap('collectRingIfSafe',function(tileKey){
    const gameState=currentState();
    const tile=gameState?.tiles?.[tileKey];
    if(!gameState?.player?.hasRing&&gameState?.ringActivated&&gameState?.ringKey===tileKey&&tile?.hasRing&&!tile?.monsterPending&&!(tile?.monster?.health>0)){
      track('ring_collected',{elapsed_seconds:elapsedSeconds(),tiles_explored:exploredTiles()});
    }
  });

  const originalFirkin=window.collectFirkinIfSafe;
  if(typeof originalFirkin==='function'&&!originalFirkin.__bodAnalyticsWrapped){
    function trackedFirkin(){
      const hadFirkin=!!currentState()?.player?.companionFirkin;
      const result=originalFirkin.apply(this,arguments);
      if(!hadFirkin&&currentState()?.player?.companionFirkin){
        track('firkin_rescued',{elapsed_seconds:elapsedSeconds(),tiles_explored:exploredTiles()});
      }
      return result;
    }
    trackedFirkin.__bodAnalyticsWrapped=true;
    window.collectFirkinIfSafe=trackedFirkin;
  }

  wrap('death',function(){
    const gameState=currentState();
    const player=gameState?.player;
    const insured=!!(player&&(player.flags?.insurance||[...(player.backpack||[]),...(player.inventory||[])].some(item=>item?.name==='Acme Insurance')));
    track('player_died',{
      cause:gameState?.lastDeath?.title||'Unknown',
      insured,
      elapsed_seconds:elapsedSeconds(),
      tiles_explored:exploredTiles(),
      monsters_defeated:player?.killed?.length||0
    });
  });

  wrap('win',function(){
    const gameState=currentState();
    const player=gameState?.player;
    track('game_completed',{
      character_id:gameState?.charDef?.id||'unknown',
      firkin_rescued:!!player?.companionFirkin,
      elapsed_seconds:elapsedSeconds(),
      tiles_explored:exploredTiles(),
      monsters_defeated:player?.killed?.length||0
    });
  });

  document.getElementById('buyBodButton')?.addEventListener('click',()=>{
    track('buy_bod_clicked',{link_url:'https://www.gunpowderstudios.co.uk/'});
  });
})();
