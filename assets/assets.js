window.ASSET_PATHS={
 "Start":"assets/tiles/start.png","Exit":"assets/tiles/exit.png","Straight":"assets/tiles/straight.png","Corner":"assets/tiles/corner.png","T-Junction":"assets/tiles/tjunction.png","Crossroad":"assets/tiles/crossroad.png","Spike Trap":"assets/tiles/spiketrap.png","Healing Pool":"assets/tiles/healingpool.png","Hidden Monster":"assets/ui/hiddenmonster.png","Ring":"assets/ui/ring.png",
 "Sirrus the Fighter":"assets/heroes/sirrus.png","Tamara the Fighter":"assets/heroes/tamara.png","Duric the Dwarf":"assets/heroes/duric.png","Marria the Dwarf":"assets/heroes/marria.png","Rill the Healer":"assets/heroes/rill.png","Tarak the Healer":"assets/heroes/tarak.png","Alendra the Elf":"assets/heroes/alendra.png","Galhorn the Elf":"assets/heroes/galhorn.png",
 "Goblin":"assets/monsters/goblin.png","Zombie":"assets/monsters/zombie.png","Mummy":"assets/monsters/mummy.png","Monk":"assets/monsters/monk.png","Mud Monster":"assets/monsters/mudmonster.png","Werewolf":"assets/monsters/werewolf.png","Troll":"assets/monsters/troll.png","Minotaur":"assets/monsters/minotaur.png","Skeleton":"assets/monsters/skeleton.png","Giant Snake":"assets/monsters/giantsnake.png","Reacher":"assets/monsters/reacher.png","Mirror Monster":"assets/monsters/mirrormonster.png","Dragon":"assets/monsters/dragon.png"
};

<<<<<<< HEAD
(function(){
 const VERSION='v11.37';
 function apply(){
  document.title='Bag of Dungeon 3D '+VERSION;
  const logo=document.getElementById('heroSelectLogo');if(logo){logo.style.display='';logo.src='./assets/ui/bod3d-logo.png';}
  const visible=document.getElementById('visibleBuildVersion');if(visible)visible.textContent=VERSION;
  const brand=document.getElementById('brandHeader');if(brand)brand.querySelectorAll('.version,.buildVersion,#bodVersionUnderLogo,#topLogoVersion').forEach(el=>{if(el!==visible)el.style.display='none';});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();setTimeout(apply,700);
=======
// Keep the loading-screen logo repository-relative so it works on GitHub Pages.
(function fixLoadingLogo(){
  function apply(){
    const logo=document.getElementById('heroSelectLogo');
    if(!logo)return false;
    logo.style.display='';
    logo.style.visibility='visible';
    logo.style.opacity='1';
    logo.src=new URL('assets/ui/bod3d-logo.png?v=11.23-logo-fix-4',document.baseURI).href;
    return true;
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{
      if(apply())return;
      let tries=0;
      const timer=setInterval(()=>{if(apply()||++tries>=50)clearInterval(timer);},100);
    },{once:true});
  }else if(!apply()){
    let tries=0;
    const timer=setInterval(()=>{if(apply()||++tries>=50)clearInterval(timer);},100);
  }
>>>>>>> 920d67c270a072ebb559a70d20a92459e5587fdc
})();

(function(){
 let muted=false;
 if(!HTMLMediaElement.prototype.__bodDungeonMutePatched){const originalPlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){const src=String(this.currentSrc||this.src||'');if(window.__BOD_DUNGEON_AMBIENCE_MUTED__&&/(?:^|\/)dungeon-sounds\.mp3(?:\?|$)/i.test(src)){try{this.pause();}catch(_){}return Promise.resolve();}return originalPlay.apply(this,arguments);};HTMLMediaElement.prototype.__bodDungeonMutePatched=true;}
 function update(b){b.textContent=muted?'🔇':'🔊';b.title=muted?'Dungeon ambience off — click to turn on':'Dungeon ambience on — click to turn off';b.setAttribute('aria-label',b.title);b.setAttribute('aria-pressed',muted?'true':'false');}
 function install(){if(document.getElementById('dungeonSoundToggle'))return true;const fs=document.getElementById('fullscreenBtn');if(!fs||!fs.parentNode)return false;const b=document.createElement('button');b.id='dungeonSoundToggle';b.type='button';update(b);b.onclick=e=>{e.preventDefault();e.stopPropagation();muted=!muted;window.__BOD_DUNGEON_AMBIENCE_MUTED__=muted;muted?window.stopDungeonAmbience?.():window.startDungeonAmbience?.();update(b);};fs.insertAdjacentElement('beforebegin',b);return true;}
 function start(){window.__BOD_DUNGEON_AMBIENCE_MUTED__=false;if(!install()){let n=0,t=setInterval(()=>{if(install()||++n>100)clearInterval(t);},50);}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

(function(){
 if(HTMLMediaElement.prototype.__bodBackgroundLifecyclePatched)return;
 const play=HTMLMediaElement.prototype.play,tracks=new Set(),resume=new Set();
 HTMLMediaElement.prototype.play=function(){if(this.loop)tracks.add(this);return play.apply(this,arguments);};HTMLMediaElement.prototype.__bodBackgroundLifecyclePatched=true;
 const pause=()=>tracks.forEach(t=>{if(!t.paused){resume.add(t);try{t.pause();}catch(_){}}});
 const restart=()=>{if(document.hidden)return;resume.forEach(t=>{const src=String(t.currentSrc||t.src||'');if(window.__BOD_DUNGEON_AMBIENCE_MUTED__&&/dungeon-sounds\.mp3/i.test(src))return;play.call(t).catch(()=>{});});resume.clear();};
 document.addEventListener('visibilitychange',()=>document.hidden?pause():restart());window.addEventListener('pagehide',pause);window.addEventListener('beforeunload',pause);window.addEventListener('pageshow',restart);
})();

<<<<<<< HEAD
(function(){
 function install(){
  if(window.__bodTestGameplayRulesInstalled)return true;
  if(typeof CHARACTERS==='undefined'||typeof drawItem!=='function'||typeof drawMonster!=='function'||typeof placeExitAndRing!=='function'||typeof collectRingIfSafe!=='function'||typeof killMonster!=='function')return false;
  window.__bodTestGameplayRulesInstalled=true;
  const heroes=CHARACTERS.filter(h=>h.id==='sirrus'||h.id==='tamara');CHARACTERS.splice(0,CHARACTERS.length,...heroes);selectedCharacterIndex=Math.min(selectedCharacterIndex,CHARACTERS.length-1);renderCharSelect();
  const locked=new Set(['Ice Staff','Large Steel Axe']);
  const laid=()=>!state?.tiles?0:Object.values(state.tiles).filter(t=>t&&t.kind!=='start'&&t.kind!=='exit').length;
  drawItem=function(){if(!state?.itemDeck?.length)return null;const open=laid()>=20;for(let i=state.itemDeck.length-1;i>=0;i--){const c=state.itemDeck[i];if(open||!locked.has(c.name)){const x=state.itemDeck.splice(i,1)[0];return x?{...x}:null;}}return null;};
  const assigned=()=>!!(state&&(state.player?.hasRing||state.ringCarrierAssigned||Object.values(state.tiles||{}).some(t=>t?.hasRing||t?.monster?.carriesRing)));
  function giveRing(m,k=null){if(!state||!m||m.isDragon||m.maxHealth<10||assigned())return false;m.carriesRing=true;state.ringCarrierAssigned=true;state.ringActivated=true;state.ringKey=k;state.ringNumber=null;state.ringRoll=null;log('A powerful monster somewhere in the dungeon now carries the Ring of Creation.','loot');return true;}
  function ensureRing(){if(!state||laid()<20||assigned())return;const c=Object.entries(state.tiles||{}).filter(([,t])=>t?.monster&&t.monster.health>0&&!t.monster.isDragon&&t.monster.maxHealth>=10);if(c.length){const [k,t]=c[Math.floor(Math.random()*c.length)];giveRing(t.monster,k);}}
  const oldDrawMonster=drawMonster;drawMonster=function(){const m=oldDrawMonster.apply(this,arguments);if(m&&laid()>=20&&!assigned())giveRing(m,null);return m;};
  placeExitAndRing=function(x,y,from){state.exitPlaced=true;let exitKey=null,placed=false;for(const dir of dirOrder){const d=DIRS[dir],ex=x+d.dx,ey=y+d.dy;if(from.opens[dir]&&!getTile(ex,ey)){exitKey=key(ex,ey);state.tiles[exitKey]={kind:'exit',opens:{...TILE_BASE.exit},rot:0,visited:false,monster:{name:'Red Dragon',dice:4,mod:0,maxHealth:20,health:20,glyph:'🐉',revealed:true,isDragon:true}};placed=true;break;}}if(!placed)for(const dir of dirOrder){const d=DIRS[dir],ex=x+d.dx,ey=y+d.dy;if(!getTile(ex,ey)){exitKey=key(ex,ey);state.tiles[exitKey]={kind:'exit',opens:{...TILE_BASE.exit},rot:0,visited:false,monster:{name:'Red Dragon',dice:4,mod:0,maxHealth:20,health:20,glyph:'🐉',revealed:true,isDragon:true}};break;}}playSound('dragon');playTileEffect(exitKey,'dragon',1400);log('The final dungeon tile is laid. The Exit appears and the Red Dragon guards it.','loot');ensureRing();};
  collectRingIfSafe=function(k){if(!state.ringActivated||state.player.hasRing||state.ringKey!==k||key(state.player.x,state.player.y)!==k)return false;const t=state.tiles[k];if(!t||!t.hasRing||t.monsterPending||(t.monster&&t.monster.health>0))return false;t.hasRing=false;state.player.hasRing=true;playSound('ring');playTileEffect(k,'ring',1200);log('You found the Ring of Creation — now get out!','loot');showModal('THE RING OF CREATION','You found the Ring of Creation — now get out!',[{text:'Get Out!',cls:'green',fn:closeModal}]);return true;};
  const oldRangedKill=rangedKill;rangedKill=function(tile,k,m,w,d){const ring=!!m?.carriesRing;if(ring){tile.hasRing=true;state.ringActivated=true;state.ringCarrierAssigned=true;state.ringKey=k;m.isDragon=true;}const r=oldRangedKill.apply(this,arguments);if(ring){m.isDragon=false;log(m.name+' drops the Ring of Creation!','loot');}return r;};
  killMonster=function(){const m=combat.tile.monster,t=combat.tile,k=combat.sourceKey||key(state.player.x,state.player.y),ring=!!m.carriesRing;playSound('monsterDie');playTileEffect(k,'monsterDeath',1000);log('Defeated '+m.name+'.','combat');state.player.killed.push(m.name);state.monsterDiscard.push(m);recordMonsterCorpse(t,k,m);t.monster=null;if(ring){t.hasRing=true;state.ringActivated=true;state.ringCarrierAssigned=true;state.ringKey=k;log(m.name+' drops the Ring of Creation!','loot');}if(m.isDragon&&state.player.hasRing){win();return;}const count=(!m.isDragon&&!ring)?(m.maxHealth>=10?2:(m.maxHealth>=6?1:0)):0;if(!m.isDragon&&!ring&&!count)log(m.name+' had '+m.maxHealth+' starting Health: no item reward.','system');if(count)log(m.name+' had '+m.maxHealth+' starting Health: draw '+count+' item'+(count===1?'':'s')+'.','loot');closeCombat();render();if(ring){setTimeout(()=>collectRingIfSafe(k),80);return;}if(count)setTimeout(()=>{for(let i=0;i<count;i++)awardItem();},120);};
  setInterval(ensureRing,500);return true;
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(install())return;let n=0,t=setInterval(()=>{if(install()||++n>100)clearInterval(t);},50);},{once:true});else if(!install()){let n=0,t=setInterval(()=>{if(install()||++n>100)clearInterval(t);},50);}
})();

(function(){
 function install(){let hud=document.getElementById('livesHud'),main=document.getElementById('main');if(!main)return false;if(!hud){hud=document.createElement('div');hud.id='livesHud';hud.setAttribute('aria-live','polite');main.appendChild(hud);}function update(){if(!state?.player){hud.style.display='none';return;}hud.style.display='flex';const hp=Math.max(0,Math.floor(Number(state.player.health)||0)),max=Math.max(hp,Math.floor(Number(state.player.maxHealth)||hp));hud.innerHTML=Array.from({length:max},(_,i)=>'<span class="lifeHeart'+(i<hp?'':' emptyHeart')+'" aria-hidden="true">♥</span>').join('');hud.setAttribute('aria-label',hp+' of '+max+' health remaining');}update();setInterval(update,120);return true;}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(!install()){let n=0,t=setInterval(()=>{if(install()||++n>100)clearInterval(t);},50);}},{once:true});else install();
})();

(function(){
 function install(){if(window.__bodCombatOnlyAPInstalled)return true;if(typeof move!=='function'||typeof startPlace!=='function')return false;window.__bodCombatOnlyAPInstalled=true;const oldMove=move;move=function(){if(!state?.player)return oldMove.apply(this,arguments);const ap=state.player.ap;if(ap<1)state.player.ap=1;const r=oldMove.apply(this,arguments);state.player.ap=ap;render?.();return r;};const oldStart=startPlace;startPlace=function(){if(!state?.player)return oldStart.apply(this,arguments);const ap=state.player.ap;if(ap<1)state.player.ap=1;const r=oldStart.apply(this,arguments);state.player.ap=ap;return r;};const place=document.getElementById('placeBtn');if(place?.onclick&&!place.__bodFreePlacementPatched){const old=place.onclick;place.onclick=function(){const ap=state?.player?.ap,r=old.apply(this,arguments);if(state?.player&&Number.isFinite(ap))state.player.ap=ap;render?.();return r;};place.__bodFreePlacementPatched=true;}const hide=()=>document.querySelectorAll('button').forEach(b=>{const s=((b.id||'')+' '+(b.className||'')+' '+(b.textContent||'')).toLowerCase();if(/\brest\b/.test(s)&&!b.closest('#combat'))b.style.setProperty('display','none','important');});hide();new MutationObserver(hide).observe(document.documentElement,{subtree:true,childList:true,characterData:true});return true;}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(!install()){let n=0,t=setInterval(()=>{if(install()||++n>100)clearInterval(t);},50);}},{once:true});else install();
})();

(function(){
 const style=document.createElement('style');style.id='bodTestResponsiveStyles';style.textContent=`
 .chooseHeroBtn{min-width:230px;min-height:58px;padding:14px 28px!important;font-size:21px!important}
 #modal .card,#placement .card{width:min(94vw,620px);max-height:min(88vh,760px);overflow:auto;padding:20px}
 #modal .card h2,#placement .card h2{font-size:28px;line-height:1.08}#modalBody,#placement .desc{font-size:19px;line-height:1.35}
 #modal .btnrow button,#placement .btnrow button{min-height:48px;font-size:17px;padding:11px 16px}
 #topbar{left:22px!important;right:110px!important;top:18px!important;gap:18px!important;align-items:center!important}#topbar .cluster{gap:18px!important;align-items:center!important;flex-wrap:nowrap!important}
 #topbar button,#fullscreenBtn,#dungeonSoundToggle{appearance:none!important;-webkit-appearance:none!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;color:#fff!important;text-shadow:0 1px 3px #000!important;padding:8px 10px!important;min-width:44px!important;min-height:44px!important;font-family:"Alegreya Sans",Arial,sans-serif!important;font-size:18px!important;font-weight:700!important;line-height:1!important;display:flex!important;align-items:center!important;justify-content:center!important;white-space:nowrap!important;opacity:.94}
 #fullscreenBtn{position:absolute!important;top:18px!important;right:18px!important;z-index:68!important;font-size:25px!important;width:46px!important;height:46px!important}#dungeonSoundToggle{position:absolute!important;top:18px!important;right:66px!important;z-index:68!important;font-size:22px!important;width:46px!important;height:46px!important}
 #livesHud{position:absolute!important;top:16px!important;left:50%!important;transform:translateX(-50%)!important;z-index:67!important;display:flex!important;justify-content:center!important;gap:3px!important;max-width:34vw!important;padding:0!important;background:transparent!important;pointer-events:none!important}#livesHud .lifeHeart{font-size:19px!important;color:#ef333b!important;text-shadow:0 1px 4px #000!important}#livesHud .emptyHeart{opacity:.22!important}
 .bodWarningWrap{position:fixed!important;left:50%!important;top:54%!important;transform:translate(-50%,-50%)!important;width:min(88vw,calc(72vh * 1.58),760px)!important;height:auto!important;max-width:calc(100vw - 48px)!important;max-height:72vh!important;aspect-ratio:1.58/1!important;display:grid!important;place-items:center!important;overflow:visible!important;box-sizing:border-box!important}
 .bodWarningScroll{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;display:block!important}
 .bodWarningContent{position:relative!important;z-index:2!important;width:58%!important;max-width:58%!important;max-height:60%!important;margin:0!important;padding:0!important;transform:translateX(5%)!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;text-align:center!important;color:#000!important;font-size:clamp(10px,.88vw,15px)!important;line-height:1.17!important;overflow:visible!important;white-space:normal!important;box-sizing:border-box!important}
 .bodWarningContent,.bodWarningContent *{left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;inset:auto!important;float:none!important;max-width:100%!important;box-sizing:border-box!important;white-space:normal!important;overflow:visible!important}
 .bodWarningContent>*{position:relative!important;transform:none!important;width:100%!important;margin-left:0!important;margin-right:0!important}
 .bodWarningContent h1,.bodWarningContent h2,.bodWarningContent h3{font-size:clamp(15px,1.5vw,23px)!important;line-height:1.05!important;margin:0 0 .45em!important}.bodWarningContent p{margin:.24em 0!important;overflow-wrap:break-word!important}.bodWarningContent button{width:auto!important;align-self:center!important;margin-top:.48em!important;min-height:38px!important;padding:7px 14px!important;font-size:clamp(12px,.9vw,15px)!important}
 @media(min-width:901px) and (max-height:820px){.bodWarningWrap{top:56%!important;width:min(82vw,calc(64vh * 1.58),680px)!important;max-height:64vh!important}.bodWarningContent{width:57%!important;max-width:57%!important;max-height:58%!important;font-size:clamp(9px,.75vw,13px)!important;line-height:1.12!important}.bodWarningContent h1,.bodWarningContent h2,.bodWarningContent h3{font-size:clamp(14px,1.2vw,19px)!important}.bodWarningContent p{margin:.18em 0!important}.bodWarningContent button{min-height:34px!important;margin-top:.28em!important;padding:5px 11px!important}}
 @media(max-width:900px){#topbar{left:6px!important;right:94px!important;top:7px!important;gap:4px!important}#topbar .cluster{gap:1px!important}#topbar button{font-size:15px!important;padding:7px 6px!important;min-width:38px!important;min-height:40px!important}#fullscreenBtn{top:7px!important;right:5px!important;width:42px!important;height:42px!important}#dungeonSoundToggle{top:7px!important;right:47px!important;width:42px!important;height:42px!important}#livesHud{top:52px!important;max-width:82vw!important}#livesHud .lifeHeart{font-size:15px!important}.bodWarningWrap{top:50%!important;width:min(94vw,680px)!important;max-width:calc(100vw - 16px)!important;max-height:70dvh!important}.bodWarningContent{width:69%!important;max-width:69%!important;transform:translateX(2%)!important;font-size:clamp(11px,1.8vw,17px)!important}}
 @media(max-width:700px){#modal,#placement{padding:8px}#modal .card,#placement .card{width:96vw;max-height:92dvh;padding:20px 16px}#modalBody,#placement .desc{font-size:21px;line-height:1.38}.chooseHeroBtn{width:min(88vw,360px);min-height:66px;font-size:24px!important}.bodWarningWrap{width:96vw!important;max-width:540px!important}.bodWarningContent{width:68%!important;max-width:68%!important;max-height:66%!important;font-size:clamp(10px,3.2vw,16px)!important;line-height:1.18!important}.bodWarningContent h1,.bodWarningContent h2,.bodWarningContent h3{font-size:clamp(15px,4.3vw,23px)!important}.bodWarningContent button{min-height:48px!important;font-size:16px!important;padding:11px 16px!important}}
 @media(max-width:900px) and (orientation:landscape){.bodWarningWrap{width:min(70vw,650px)!important}.bodWarningContent{font-size:clamp(10px,1.65vw,15px)!important;line-height:1.13!important}.bodWarningContent h1,.bodWarningContent h2,.bodWarningContent h3{font-size:clamp(15px,2.7vw,22px)!important;margin-bottom:.3em!important}.bodWarningContent p{margin:.2em 0!important}.bodWarningContent button{min-height:40px!important;margin-top:.35em!important;padding:7px 14px!important}}
 `;document.head.appendChild(style);
})();

(function(){
 function install(){
  const img=[...document.images].find(i=>/scroll\.png(?:\?|$)/i.test(String(i.currentSrc||i.src||'')));if(!img)return false;
  let wrap=img.parentElement;while(wrap&&wrap!==document.body){const txt=(wrap.textContent||'').toLowerCase();if((txt.includes('warning from the dungeon')||txt.includes('one life'))&&wrap.querySelector('button'))break;wrap=wrap.parentElement;}if(!wrap||wrap===document.body)return false;
  wrap.classList.add('bodWarningWrap');img.classList.add('bodWarningScroll');
  let content=wrap.querySelector(':scope > .bodWarningContent');
  if(!content){content=document.createElement('div');content.className='bodWarningContent';const nodes=[...wrap.childNodes].filter(n=>n!==img);nodes.forEach(n=>content.appendChild(n));wrap.appendChild(content);}
  return true;
 }
 function start(){if(install())return;let n=0,t=setInterval(()=>{if(install()||++n>120)clearInterval(t);},50);new MutationObserver(()=>install()).observe(document.body,{subtree:true,childList:true});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
=======
// Improve contrast on the Enter the Dungeon hover/focus state.
(function installEnterDungeonHoverFix(){
  const style=document.createElement('style');
  style.id='enterDungeonHoverFix';
  style.textContent=`
    .chooseHeroBtn:hover,
    .chooseHeroBtn:focus-visible{
      background:linear-gradient(#fff2c8,#efd68b)!important;
      color:#000!important;
    }
  `;
  document.head.appendChild(style);
})();

// Replace the logo node after startup to remove the obsolete error handler in patches.js.
setTimeout(()=>{
  const oldLogo=document.getElementById('heroSelectLogo');
  if(!oldLogo||!oldLogo.parentNode)return;
  const logo=oldLogo.cloneNode(false);
  logo.removeAttribute('style');
  logo.style.setProperty('display','block','important');
  logo.style.setProperty('visibility','visible','important');
  logo.style.setProperty('opacity','1','important');
  logo.src=new URL('assets/ui/bod3d-logo.png?v=11.23-logo-fix-4',document.baseURI).href;
  oldLogo.replaceWith(logo);
},1500);
>>>>>>> 920d67c270a072ebb559a70d20a92459e5587fdc
