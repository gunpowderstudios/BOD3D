// Bag of Dungeon 3D — combat logic (melee, ranged attacks, monster charging, dice rolls,
// combat UI rendering, damage/impact effects, death/escape handling)
// Split out of index.html for easier editing. Depends on state/helpers from game.js, so
// this must load AFTER game.js.

function pCombatMod(){const p=state.player,e=p.equipment;const weapons=e.weapons||[e.weapon].filter(Boolean);return p.baseMod+weapons.reduce((total,weapon)=>total+applyEquipmentStats(weapon),0)+(e.torch?1:0)+(p.companionFirkin?1:0)}
function pDamageReduction(){const e=state.player.equipment;return applyEquipmentStats(e.armour)+applyEquipmentStats(e.shield)}
function pDice(){const p=state.player;const dragonBonus=!!(combat?.tile?.monster?.isDragon&&p.equipment.dragonlance);return p.baseDice+(p.equipment.bear?1:0)+(p.temp.strength?1:0)+(dragonBonus?1:0)}
function playUsedItemSounds(items,fallbackKey=''){
 const unique=[...new Set((items||[]).filter(Boolean))];
 if(!unique.length){if(fallbackKey)playSound(fallbackKey);return;}
 unique.forEach((item,index)=>setTimeout(()=>playItemSound(item),index*70));
}
function meleeItemsUsed(player,monster){
 const equipment=player?.equipment||{};
 const items=[...(equipment.weapons||[equipment.weapon].filter(Boolean))];
 if(equipment.torch)items.push(equipment.torch);
 if(monster?.isDragon&&equipment.dragonlance)items.push(equipment.dragonlance);
 if(equipment.bear)items.push(equipment.bear);
 return items;
}
function openCombat(tile,options={}){
 if(!view3d.enabled){toast('Return to 3D to fight');return;}
 closeModal();
 const m=tile.monster;
 combat={
  tile,
  openingShot:true,
  monsterSkip:false,
  reroll:false,
  rolling:false,
  hadMeleeRound:false,
  mustFightRound:!!options.mustFightRound,
  noEscape:!!options.noEscape,
  rangedEngagement:!!options.rangedEngagement,
  restoreApAfterRanged:!!options.restoreApAfterRanged,
  sourceKey:options.sourceKey||null,
  chargedFromKey:options.chargedFromKey||null
 };

 document.body.classList.add('combatActive','cinematicCombat');

 const combatTileKey=options.sourceKey||key(state.player.x,state.player.y);
 combat.tileKey=combatTileKey;
 window.BOD3D?.beginCombat?.(combatTileKey);

 // Collapse the mobile character drawer before combat appears.
 if(typeof setMobileSheetExpanded==='function'){
  setMobileSheetExpanded(false);
 }

 const combatElement=document.getElementById('combat');
 combatElement.classList.remove('open');
 setTimeout(()=>{
  if(combat&&combat.tile===tile){
   combatElement.classList.add('open');
   sndMonsterCombat(m.name);
  }
 },520);
 document.getElementById('combatTitle').textContent=
  options.rangedEngagement?'The Monster Charges!':(options.noEscape?'Spotted!':'Combat');
 document.getElementById('combatLog').textContent=
  options.rangedEngagement
   ?'Your attack didn\'t finish it — the monster charges onto your tile. There is no escaping this fight.'
   :(options.noEscape
     ?'You have been seen. There is no escaping this fight.'
     :'Ready to fight!');

 const tray=document.getElementById('diceTray');
 if(tray){
  tray.className='diceTray';
  tray.innerHTML='Dice will appear here.';
 }

 // Always begin at the top of the mobile combat card.
 const combatCard=document.querySelector('#combat .card');
 if(combatCard)combatCard.scrollTop=0;

 renderCombat();
}
function connectedDistance(fromKey,toKey,maxRange){if(fromKey===toKey)return 0;const q=[[fromKey,0]],seen=new Set([fromKey]);while(q.length){const [kk,dst]=q.shift();if(dst>=maxRange)continue;const [x,y]=kk.split(',').map(Number),t=state.tiles[kk];if(!t)continue;for(const dir of dirOrder){if(!t.opens[dir])continue;const dd=DIRS[dir],nk=key(x+dd.dx,y+dd.dy),nt=state.tiles[nk];if(!nt||!nt.opens[dd.opp]||seen.has(nk))continue;if(nk===toKey)return dst+1;seen.add(nk);q.push([nk,dst+1]);}}return Infinity;}
function straightCorridorDistance(fromKey,toKey,maxRange){
 if(fromKey===toKey)return 0;
 const [fx,fy]=fromKey.split(',').map(Number),[tx,ty]=toKey.split(',').map(Number);
 let dir=null,steps=0;
 if(fx===tx){dir=ty<fy?'N':'S';steps=Math.abs(ty-fy);}
 else if(fy===ty){dir=tx<fx?'W':'E';steps=Math.abs(tx-fx);}
 else return Infinity;
 if(steps<1||steps>maxRange)return Infinity;
 let x=fx,y=fy;
 const dd=DIRS[dir];
 for(let i=0;i<steps;i++){
  const t=state.tiles[key(x,y)];
  const nx=x+dd.dx,ny=y+dd.dy,nt=state.tiles[key(nx,ny)];
  if(!t||!nt||!t.opens[dir]||!nt.opens[dd.opp])return Infinity;
  x=nx;y=ny;
 }
 return steps;
}

function connectedPath(fromKey,toKey,maxRange=99){
 if(fromKey===toKey)return [fromKey];
 const q=[fromKey],seen=new Set([fromKey]),prev={};
 while(q.length){
  const kk=q.shift();
  const pathDepth=(()=>{
   let d=0,c=kk;
   while(prev[c]){d++;c=prev[c];}
   return d;
  })();
  if(pathDepth>=maxRange)continue;
  const [x,y]=kk.split(',').map(Number),t=state.tiles[kk];
  if(!t)continue;
  for(const dir of dirOrder){
   if(!t.opens[dir])continue;
   const dd=DIRS[dir],nk=key(x+dd.dx,y+dd.dy),nt=state.tiles[nk];
   if(!nt||!nt.opens[dd.opp]||seen.has(nk))continue;
   seen.add(nk);
   prev[nk]=kk;
   if(nk===toKey){
    const path=[nk];
    let cur=nk;
    while(cur!==fromKey){cur=prev[cur];path.push(cur);}
    return path.reverse();
   }
   q.push(nk);
  }
 }
 return [];
}
function straightCorridorPath(fromKey,toKey,maxRange=99){
 const distance=straightCorridorDistance(fromKey,toKey,maxRange);
 if(!Number.isFinite(distance))return [];
 const [fx,fy]=fromKey.split(',').map(Number),[tx,ty]=toKey.split(',').map(Number);
 const dx=Math.sign(tx-fx),dy=Math.sign(ty-fy);
 const path=[];
 for(let i=0;i<=distance;i++)path.push(key(fx+dx*i,fy+dy*i));
 return path;
}
function rangedChargePath(heroTileKey,monsterTileKey,attackType){
 return attackType==='daggers'
  ?connectedPath(heroTileKey,monsterTileKey,99)
  :straightCorridorPath(heroTileKey,monsterTileKey,99);
}
function chargingMonsterTrapTile(heroTileKey,monsterTileKey,attackType){
 const path=rangedChargePath(heroTileKey,monsterTileKey,attackType);
 if(path.length<3)return null;
 // Charge runs from monster back toward hero. Exclude both endpoints.
 const intermediate=path.slice(1,-1).reverse();
 const trapKey=intermediate.find(k=>state.tiles[k]?.kind==='spike');
 return trapKey||null;
}
function dropMonsterRewardsOnTile(monster,tile,tileKey){
 if(!monster||monster.isDragon||!tile)return;
 const startingHealth=monster.maxHealth;
 const rewardCount=startingHealth>=10?2:(startingHealth>=6?1:0);
 if(rewardCount===0){
  log(monster.name+' had '+startingHealth+' starting Health: no item reward.','system');
  return;
 }
 tile.droppedItems=tile.droppedItems||[];
 for(let i=0;i<rewardCount;i++){
  const reward=drawItem();
  if(reward)tile.droppedItems.push(reward);
 }
 log(monster.name+' drops '+rewardCount+' item'+(rewardCount===1?'':'s')+' on Old Spikey.','loot');
}
async function resolveChargingMonsterTrap(originalTile,originalTileKey,monster,heroTileKey,attackType){
 const trapKey=chargingMonsterTrapTile(heroTileKey,originalTileKey,attackType);
 if(!trapKey)return false;
 const trapTile=state.tiles[trapKey];
 if(!trapTile)return false;

 log(monster.name+' charges through Old Spikey — the trap strikes automatically!','combat');
 const dmgRoll=roll(1);
 playSound('dice');
 const dicePromise=window.BODDice3D?.roll?.(dmgRoll.rolls,'monster');
 if(dicePromise&&typeof dicePromise.then==='function')await dicePromise;

 const dmg=dmgRoll.total;
 monster.health-=dmg;
 playSound('trap');
 playSound('hit');
 playTileEffect(trapKey,'trap',900);
 log('Old Spikey deals '+dmg+' damage to '+monster.name+'.','combat');

 if(monster.health>0){
  render();
  return false;
 }

 playSound('monsterDie');
 playTileEffect(trapKey,'monsterDeath',1000);
 log('Old Spikey kills '+monster.name+' before it reaches you!','combat');
 state.player.killed.push(monster.name);
 state.monsterDiscard.push(monster);
 originalTile.monster=null;
 originalTile.monsterPending=false;
 recordMonsterCorpse(trapTile,trapKey,monster);
 dropMonsterRewardsOnTile(monster,trapTile,trapKey);
 render();
 return true;
}

function rangedTargets(range,allowCorners=false){
 const from=key(state.player.x,state.player.y),out=[];
 for(const [kk,t] of Object.entries(state.tiles)){
  if(!(t.monsterPending||(t.monster&&t.monster.health>0)))continue;
  if(t.monster?.isDragon)continue;
  const distance=allowCorners?connectedDistance(from,kk,range):straightCorridorDistance(from,kk,range);
  if(distance>=1&&distance<=range)out.push({key:kk,distance});
 }
 return out;
}
function startRangedAttack(type,item=null,consume=null){
 if(!view3d.enabled){toast('Return to 3D to fight');return;}
 const p=state.player;
 let weapon=null,range=0,cost=0,label='';

 if(type==='bow'){
  weapon=p.equipment.bow;
  if(!weapon){toast('Equip a Bow first');return;}
  range=3;
  cost=3;
  label=weapon.name;
 }else if(type==='iceStaff'){
  weapon=p.equipment.staff;
  if(!weapon){toast('Equip the Ice Staff first');return;}
  range=2;
  cost=4;
  label='Ice Staff';
 }else if(type==='fireball'){
  if(!item||item.use!=='fireball'){
   toast('Equip or carry a Fireball first');
   return;
  }
  range=5;
  cost=2;
  label='Fireball';
 }else if(type==='daggers'){
  if(!item||item.use!=='daggers'){
   toast('Carry Flying Daggers first');
   return;
  }
  range=4;
  cost=2;
  label='Flying Daggers';
 }else{
  return;
 }

 if(p.ap<cost){toast('Not enough AP');return;}

 const targets=rangedTargets(range,type==='daggers');
 if(!targets.length){
  toast('No monsters in range');
  return;
 }

 rangedMode={
  type,
  weapon,
  item,
  consume,
  range,
  cost,
  label,
  targetKeys:new Set(targets.map(target=>target.key))
 };

 closeModal();
 toast('Choose a monster in range');
 log(label+' ready: choose a monster at range 1-'+range+(type==='daggers'?' along any connected path.':' in a straight corridor.') ,'system');
 render();
}
function cancelRangedAttack(){rangedMode=null;toast('Ranged attack cancelled');render();}

async function waitForMonsterLanding(tileKey,timeout=2200){
 const tile=state.tiles[tileKey];
 if(!tile||!tile.monster)return;
 if(tile.monster._dropped)return;
 const started=performance.now();
 while(performance.now()-started<timeout){
  if(tile.monster._dropped)return;
  await new Promise(resolve=>setTimeout(resolve,30));
 }
}

function rangedKill(tile,tileKey,monster,weaponName,damage){playSound('monsterDie');playTileEffect(tileKey,'monsterDeath',1000);log(weaponName+' defeats '+monster.name+' at range with '+damage+' damage.','combat');state.player.killed.push(monster.name);state.monsterDiscard.push(monster);recordMonsterCorpse(tile,tileKey,monster);tile.monster=null;collectRingIfSafe(tileKey);const startingHealth=monster.maxHealth;if(!monster.isDragon){const rewardCount=startingHealth>=10?2:(startingHealth>=6?1:0);if(rewardCount===0)log(monster.name+' had '+startingHealth+' starting Health: no item reward.','system');else{log(monster.name+' had '+startingHealth+' starting Health: draw '+rewardCount+' item'+(rewardCount===1?'':'s')+'.','loot');for(let i=0;i<rewardCount;i++)awardItem();}}render();}
async function fireRangedAt(tileKey,event){
 if(!view3d.enabled){cancelRangedAttack();toast('Return to 3D to fight');return;}
 if(event){
  event.preventDefault();
  event.stopPropagation();
 }

 if(!rangedMode||!rangedMode.targetKeys.has(tileKey))return;

 const p=state.player;
 const tile=state.tiles[tileKey];
 if(!tile)return;

 let revealedNow=false;
 if(tile.monsterPending&&!tile.monster){
  tile.monster=drawMonster();
  tile.monsterPending=false;
  revealedNow=true;
  sndMonster(tile.monster.name);
  log('Your attack reveals '+tile.monster.name+'.','combat');
  // Render the newly revealed monster so its normal drop animation can play.
  render();
  // Do not launch the ranged attack until the monster is physically on the tile.
  await new Promise(resolve=>setTimeout(resolve,220));
}

 const monster=tile.monster;
 if(revealedNow)await new Promise(resolve=>setTimeout(resolve,120));
 if(!monster||monster.health<=0){
  toast('No monster there');
  cancelRangedAttack();
  return;
 }

 monster.revealed=true;

 if(monster.isDragon){
  playSound('dragon');
  toast('The Dragon is immune to ranged attacks');
  log('The Red Dragon is immune to ranged attacks.','combat');
  rangedMode=null;
  render();
  return;
 }

 if(p.ap<rangedMode.cost){
  toast('Not enough AP');
  rangedMode=null;
  render();
  return;
 }

 const attack={...rangedMode};
 rangedMode=null;
 p.ap-=attack.cost;
 render();

 // First frame both miniatures and the corridor between them.
 window.BOD3D?.frameRangedAttack?.(tileKey,attack.type);

 setTimeout(()=>{
  let damage=0;
  let weaponName='';

  if(attack.type==='bow'){
   weaponName=attack.weapon.name;
   const die=roll(1).total;
   damage=die+(weaponName==='Elven Bow'?2:0);
   playUsedItemSounds([attack.weapon],'bow');
   playTileEffect(tileKey,'arrow',700);
   setTimeout(()=>playSound('arrowHit'),120);
  }else if(attack.type==='iceStaff'){
   weaponName='Ice Staff';
   damage=roll(2).total;
   playUsedItemSounds([attack.weapon||{name:'Ice Staff',type:'equipment'}],'ice');
   window.BOD3D?.playEffect?.('ice',tileKey);
  }else if(attack.type==='fireball'){
   weaponName='Fireball';
   damage=roll(3).total;
   playUsedItemSounds([attack.weapon||{name:'Fireball',type:'spell'}],'fireball');
   window.BOD3D?.playEffect?.('fireball',tileKey);
   attack.consume?.();
  }else if(attack.type==='daggers'){
   weaponName='Flying Daggers';
   damage=roll(2).total;
   playUsedItemSounds([attack.weapon||{name:'Flying Daggers',type:'spell'}],'spell');
   playTileEffect(tileKey,'arrow',850);
   setTimeout(()=>playSound('arrowHit'),120);
   attack.consume?.();
  }

  monster.health-=damage;
  log(
   weaponName+' ranged attack deals '+damage+' damage to '+monster.name+'.',
   'combat'
  );
  render();

  // Leave the projectile and impact visible before resolving death or charge.
  setTimeout(async()=>{
   if(monster.health<=0){
    p.ap=p.maxAp;
    rangedKill(tile,tileKey,monster,weaponName,damage);
    window.BOD3D?.finishRangedAttack?.();
    return;
   }

   const heroTileKey=key(p.x,p.y);
   const heroTile=state.tiles[heroTileKey];

   // Board-game rule: a monster charging through Old Spikey triggers it
   // automatically and takes 1d6 damage before reaching the hero.
   const killedByTrap=await resolveChargingMonsterTrap(
    tile,
    tileKey,
    monster,
    heroTileKey,
    attack.type
   );
   if(killedByTrap){
    p.ap=p.maxAp;
    render();
    window.BOD3D?.finishRangedAttack?.();
    return;
   }

   log(
    monster.name+' survives and charges onto your tile! There is no escape.',
    'combat'
   );

   if(heroTile&&heroTile!==tile){
    tile.monster=null;
    tile.monsterPending=false;
    heroTile.monster=monster;
    heroTile.monsterPending=false;
    monster.revealed=true;
   }

   window.BOD3D?.finishRangedAttack?.();

   openCombat(heroTile||tile,{
    rangedEngagement:true,
    restoreApAfterRanged:true,
    noEscape:true,
    sourceKey:heroTileKey,
    chargedFromKey:tileKey
   });
   render();
  },1450);
 },520);
}
function requestRunAway(){
 if(!combat)return;
 const p=state.player;
 if(p.health>1){runAway();return;}
 const finalLife=(p.lives||1)<=1;
 showModal(
  finalLife?'RUNNING AWAY WILL END YOUR GAME!':'RUNNING AWAY WILL COST YOU A LIFE!',
  finalLife
   ?'Escaping costs 1 Health. You only have 1 Health remaining and this is your final life. Running away will end the game. Are you sure?'
   :'Escaping costs 1 Health. You only have 1 Health remaining, so running away will cost you a life and return you to Start. Lives remaining after escape: '+Math.max(0,p.lives-1)+'. Are you sure?',
  [
   {text:'Keep Fighting',fn:closeModal},
   {text:'Run Anyway',cls:'red',fn:()=>{closeModal();runAway();}}
  ]
 );
}
function renderCombat(){if(!combat)return;const p=state.player,m=combat.tile.monster,c=state.charDef||CHARACTERS[0];document.getElementById('heroGlyph').innerHTML=iconHTML(c.name,c.glyph||'🧑');const heroNameEl=document.getElementById('heroCombatName');if(heroNameEl)heroNameEl.textContent=c.name;const firkinBonus=p.companionFirkin?'<div class="small">Firkin: +1 melee bonus included</div>':'';document.getElementById('heroCombatStats').innerHTML='<div class="hearts">'+heartLine(p.health,p.maxHealth)+'</div><div>HP '+p.health+'/'+p.maxHealth+'</div><div>Combat '+pDice()+'d6+'+pCombatMod()+'</div>'+firkinBonus+'<div>Damage reduction -'+pDamageReduction()+'</div><div>AP '+p.ap+'/'+p.maxAp+'</div>';document.getElementById('monsterGlyph').innerHTML=iconHTML(m.name,m.glyph||'👹');document.getElementById('monsterName').textContent=m.name;document.getElementById('monsterCombatStats').innerHTML='<div class="hearts combatHearts">'+heartLine(m.health,m.maxHealth)+'</div><div>HP '+m.health+'/'+m.maxHealth+'</div><div>Combat '+m.dice+'d6+'+m.mod+'</div><div class="small">Monsters never score critical hits.</div><div class="small">'+(m.special||'')+'</div>';const b=document.getElementById('combatBtns');b.innerHTML='';addBtn(b,combat.rolling?'Rolling...':'Fight','green',fightRound,combat.rolling);addBtn(
 b,
 combat.noEscape
  ?'No Escape!'
  :(combat.mustFightRound?'Run Away — fight first':'Run Away (-1 HP)'),
 'red',
 requestRunAway,
 combat.noEscape||combat.mustFightRound
);combatItemButtons(b);}
const COMBAT_IMPACT_MS={hit:1600,critical:2400,kill:2800,miss:1500};
function combatImpactDuration(kind='hit'){
 return COMBAT_IMPACT_MS[kind]||COMBAT_IMPACT_MS.hit;
}
function showCombatImpact(target='monster',kind='hit',damage=0){
 const fighters=document.querySelectorAll('#combat .fighter');
 const host=target==='hero'?fighters[0]:fighters[1];
 if(!host)return combatImpactDuration(kind);
 host.querySelectorAll('.combatImpactBurst').forEach(el=>el.remove());
 const duration=combatImpactDuration(kind);
 const burst=document.createElement('div');
 burst.className='combatImpactBurst '+(target==='hero'?'heroHit ':'')+kind+'Hit';
 burst.style.setProperty('--burst-rot',Math.floor(Math.random()*50-25)+'deg');
 burst.style.setProperty('--impact-duration',duration+'ms');
 const safeDamage=Math.max(0,Math.round(Number(damage)||0));
 const label=kind==='critical'?'CRITICAL!':kind==='kill'?'KILL!':kind==='miss'?'MISS':'';
 burst.innerHTML='<div class="combatImpactText">'+
   (kind==='miss'?'':'<div class="combatDamageNumber">−'+safeDamage+'</div>')+
   (label?'<div class="combatImpactLabel">'+label+'</div>':'')+
   '</div>';
 host.appendChild(burst);
 const flashDuration=kind==='kill'?550:kind==='critical'?400:280;
 const flash=document.createElement('div');
 flash.className='combatScreenFlash '+(kind==='kill'?'killHit':kind==='critical'?'criticalHit':'');
 document.body.appendChild(flash);
 setTimeout(()=>burst.remove(),duration+80);
 setTimeout(()=>flash.remove(),flashDuration+40);
 if(kind!=='miss')spawnScreenBloodSplats(target,kind,safeDamage);
 return duration;
}

// Screen-wide sword-and-sorcery blood spray, separate from the card-confined burst above.
// Random styles and positions; larger damage creates larger, denser splats.
const SCREEN_SPLAT_COUNT={hit:3,critical:5,kill:8};
const SCREEN_SPLAT_BASE_SIZE={hit:70,critical:105,kill:145};
const SCREEN_SPLAT_STYLES=['heavySlash','diagonalSlash','scatterBurst','dripSpatter','mistSpeckle'];
function spawnScreenBloodSplats(target='monster',kind='hit',damage=0){
 const damageValue=Math.max(1,Number(damage)||1);
 const damageScale=Math.min(2.15,.72+damageValue*.12);
 const count=(SCREEN_SPLAT_COUNT[kind]||SCREEN_SPLAT_COUNT.hit)+Math.min(3,Math.floor(damageValue/4));
 const baseSize=(SCREEN_SPLAT_BASE_SIZE[kind]||SCREEN_SPLAT_BASE_SIZE.hit)*damageScale*(window.innerWidth<800?.62:1);
 const direction=Math.random()<.5?1:-1;
 for(let i=0;i<count;i++){
  const splat=document.createElement('div');
  const style=SCREEN_SPLAT_STYLES[Math.floor(Math.random()*SCREEN_SPLAT_STYLES.length)];
  splat.className='screenBloodSplat '+style+(target==='hero'?' heroSplat':'');
  const emphasis=i===0?1.35:1;
  const size=Math.round(baseSize*(.45+Math.random()*.7)*emphasis);
  const duration=900+Math.random()*650;
  const x=8+Math.random()*84;
  const y=8+Math.random()*78;
  const sweepX=direction*(25+Math.random()*90);
  const sweepY=(Math.random()-.5)*90;
  splat.style.setProperty('--splat-size',size+'px');
  splat.style.setProperty('--splat-rot',Math.floor(Math.random()*360)+'deg');
  splat.style.setProperty('--splat-duration',Math.round(duration)+'ms');
  splat.style.setProperty('--splat-x',x+'vw');
  splat.style.setProperty('--splat-y',y+'vh');
  splat.style.setProperty('--sweep-x',sweepX+'px');
  splat.style.setProperty('--sweep-y',sweepY+'px');
  document.body.appendChild(splat);
  setTimeout(()=>splat.remove(),duration+80);
 }
}

function combatItemButtons(wrap){const p=state.player;allCarriedItems().forEach((it,idx)=>{if((it.type==='spell'||it.type==='consumable'||it.use)&&it.use!=='teleport')addBtn(wrap,(it.icon||'?')+' '+it.name,'gold',()=>useInventoryIndex(idx));});}

function diceHTML(label,rolls){return '<div class="diceGroup"><span class="diceLabel">'+label+'</span>'+rolls.map(v=>'<span class="die">'+v+'</span>').join('')+'</div>';}
function showDice(playerRolls,monsterRolls,rolling=false){const tray=document.getElementById('diceTray');if(!tray)return;tray.className='diceTray'+(rolling?' rolling':'');tray.innerHTML=diceHTML('You',playerRolls)+diceHTML('Monster',monsterRolls);}
function isCritical(rolls){return rolls.length>1 && rolls.every(v=>v===rolls[0]);}
function fightRound(){
 if(!combat||combat.rolling)return;
 const p=state.player,m=combat.tile.monster;
 m.meleeStarted=true;
 combat.rolling=true;
 const pr=roll(pDice()),mr=roll(m.dice);
 combat.pendingDiceRoll={pr,mr};
 showDice(Array.from({length:pDice()},()=>'?'),Array.from({length:m.dice},()=>'?'),true);
 document.getElementById('combatLog').textContent='Rolling dice...';
 playSound('dice');
 window.BODDice3D?.rollCombat?.(pr.rolls,mr.rolls);
 renderCombat();
 setTimeout(()=>resolveFightRound(),1050);
}
function resolveFightRound(){
 if(!combat)return;
 combat.hadMeleeRound=true;
 const p=state.player,m=combat.tile.monster;
 let pr=combat.pendingDiceRoll?.pr||roll(pDice()),mr=combat.pendingDiceRoll?.mr||roll(m.dice);
 combat.pendingDiceRoll=null;
 let crit=isCritical(pr.rolls);
 let diceScore=pr.total;
 const heroCombatMod=pCombatMod();
 let pt=(crit?diceScore*2:diceScore)+heroCombatMod;
 let mt=mr.total+m.mod;
 if(p.flags.reroll){
   p.flags.reroll=false;
   pr=roll(pDice());
   crit=isCritical(pr.rolls);
   diceScore=pr.total;
   pt=(crit?diceScore*2:diceScore)+heroCombatMod;
   log("Imp's Teeth reroll used.",'loot');
 }
 showDice(pr.rolls,mr.rolls,false);
 let text='You rolled '+pr.rolls.join(', ')+' = '+pr.total+(crit?' — CRITICAL! dice score doubled to '+(pr.total*2):'')+' + '+heroCombatMod+(p.companionFirkin?' (includes Firkin +1 melee)':'')+' = '+pt+'. Monster rolled '+mr.rolls.join(', ')+' = '+mr.total+' + '+m.mod+' = '+mt+'. ';
 let damageToMonster=0,damageToHero=0;
 const deadeye=p.special==='Dead-eye'&&pr.rolls.includes(6);
 if(deadeye){damageToMonster=Math.max(0,m.health);m.health=0;text+='Dead-eye! Instant kill.';}
 else if(pt>mt){let dmg=pt-mt;damageToMonster=dmg;m.health-=dmg;text+='You hit for '+dmg+'.';}
 else if(mt>pt){if(combat.monsterSkip){combat.monsterSkip=false;text+=m.name+' is held and misses.';}else{let dmg=Math.max(0,mt-pt-pDamageReduction());damageToHero=dmg;p.health-=dmg;text+=m.name+' hits for '+dmg+'.';}}
 else{text+='Both miss.';}
 combat.rolling=false;
 combat.mustFightRound=false;
 refreshPlayerStatsPanel();
 document.getElementById('combatLog').textContent=text;
 log(text,'combat');
 const attackOutcome=damageToMonster>0?'hero':(mt>pt?'monster':'both');
 window.BOD3D?.combatPulse?.(attackOutcome);
 if(damageToMonster>0){
  playUsedItemSounds(meleeItemsUsed(p,m),'sword');
  if(crit){playSound('critical');playCurrentTileEffect('critical',850);}
  else playCurrentTileEffect('hit',650);
  showCombatImpact('monster',m.health<=0?'kill':(crit?'critical':'hit'),damageToMonster);
 }
 else if(mt>pt){
  sndMonsterCombat(m.name);
  const defenceItems=[p.equipment.armour,p.equipment.shield].filter(Boolean);
  if(Math.max(0,mt-pt)>damageToHero&&defenceItems.length)playUsedItemSounds(defenceItems);
  playSound('hit');
  showCombatImpact('hero',p.health<=0?'kill':'hit',damageToHero);
 }
 else{
  // Both miniatures meet at the middle of their 0.5-second lunges.
  setTimeout(()=>playSound('clash'),180);
  showCombatImpact('monster','miss',0);
 }
 if(m.health<=0){log('KILLING BLOW: your total of '+pt+' defeats the '+m.name+' (monster total '+mt+').','combat');setTimeout(()=>killMonster(),combatImpactDuration('kill'));return;}
 if(p.health<=0){const rawDamage=Math.max(0,mt-pt);const blocked=Math.max(0,rawDamage-damageToHero);const finalDetail=text+(blocked?' Your armour blocked '+blocked+' damage.':'')+' Final damage: '+damageToHero+'.';recordFinalBlow('Slain by the '+m.name,finalDetail);playSound('heroHurt');log('FATAL BLOW: '+m.name+' scores '+mt+' against your '+pt+' and defeats you.','combat');setTimeout(()=>death(),combatImpactDuration('kill'));return;}
 if(mt>pt)playSound('heroHurt');
 // Keep the staged 3D hero/monster objects alive for the full 0.5-second attack pulse.
 // A full board render here replaces the monster pivot and cancels both animations.
 renderCombat();
}
function recordMonsterCorpse(tile,tileKey,monster){
 if(!tile||!monster)return;

 const seed=Math.abs(
  [...String(tileKey+monster.name+state.player.killed.length)]
   .reduce((total,char)=>((total*31)+char.charCodeAt(0))|0,17)
 );

 tile.corpses=tile.corpses||[];
 tile.corpses.push({
  name:monster.name,
  rotationY:(seed%628)/100,
  fallSide:seed%2===0?1:-1,
  offsetX:(((seed>>3)%31)-15)/100,
  offsetZ:(((seed>>7)%31)-15)/100,
  bloodSeed:seed
 });
}

function killMonster(){const m=combat.tile.monster;const tileKey=combat.sourceKey||key(state.player.x,state.player.y);playSound('monsterDie');playTileEffect(tileKey,'monsterDeath',1000);log('Defeated '+m.name+'.','combat');state.player.killed.push(m.name);state.monsterDiscard.push(m);recordMonsterCorpse(combat.tile,tileKey,m);combat.tile.monster=null;if(!m.isDragon){collectRingIfSafe(tileKey);}if(!m.isDragon){const startingHealth=m.maxHealth;const rewardCount=startingHealth>=10?2:(startingHealth>=6?1:0);if(rewardCount===0){log(m.name+' had '+startingHealth+' starting Health: no item reward.','system');}else{log(m.name+' had '+startingHealth+' starting Health: draw '+rewardCount+' item'+(rewardCount===1?'':'s')+'.','loot');for(let i=0;i<rewardCount;i++)awardItem();}}closeCombat();render();if(m.isDragon)setTimeout(()=>window.BODShowClearedExitMessage?.(),80);}
function runAway(){
 if(combat?.noEscape)return;
 const p=state.player;
 const charged=!!combat?.rangedEngagement;
 p.health-=1;
 playSound('run');
 playSound('hit');
 playSound('heroHurt');
 showCombatImpact('hero',p.health<=0?'kill':'hit',1);
 log(
  charged
   ? 'Escaped the charging monster: take 1 direct damage and remain on your tile.'
   : 'Escaped combat: take 1 direct damage and return to the previous tile.',
  'combat'
 );
 if(p.health<=0){const killer=combat?.tile?.monster?.name||'monster';recordFinalBlow('Killed while escaping the '+killer,'Running away caused 1 direct damage and reduced your Health to 0.');death();return;}

 if(!charged){
  const oldX=p.x,oldY=p.y;
  p.x=p.prevX;
  p.y=p.prevY;

  // Face the direction of the retreat.
  const dx=p.x-oldX,dy=p.y-oldY;
  if(Math.abs(dx)>=Math.abs(dy)&&dx!==0)p.facing=dx>0?'E':'W';
  else if(dy!==0)p.facing=dy>0?'S':'N';

  // Run Away is an instant return, not a normal sliding move.
  // Reset the Three.js hero/camera tracking before rebuilding the board.
  window.BOD3D?.snapHeroToPlayer?.();
 }

 if(combat?.tile?.monster)combat.tile.monster.revealed=true;
 closeCombat();
 render();
 centreOnHero(false);
}

function dropDeathItems(p,deathTile,deathKey,keepCompanions){
 const bear=keepCompanions?p.companionBear:null;
 const droppable=allCarriedItems().filter(
  item=>!isBear(item)&&item.name!=='Acme Insurance'
 );

 if(droppable.length&&deathTile){
  deathTile.droppedItems=deathTile.droppedItems||[];
  deathTile.droppedItems.push(...droppable);
  log('All your items drop on the tile where you fell.','combat');
 }

 if(p.hasRing&&deathTile){
  deathTile.hasRing=true;
  state.ringActivated=true;
  state.ringKey=deathKey;
  p.hasRing=false;
  log('The Ring of Creation drops where you fell.','loot');
 }

 clearPlayerItems();
 if(keepCompanions&&bear){
  p.companionBear=bear;
  syncEquipment();
 }
}

function returnHeroToStart(p){
 p.health=p.maxHealth;
 p.ap=p.maxAp;
 p.x=0;
 p.y=0;
 p.prevX=0;
 p.prevY=0;
 p.facing='S';
 closeCombat();
 window.BOD3D?.snapHeroToPlayer?.();
 render();
 centreOnHero(false);
 setTimeout(()=>{
  window.BOD3D?.snapHeroToPlayer?.();
  render();
  centreOnHero(true);
  window.BOD3D?.centreOnHero?.();
 },120);
}

function death(){
 const p=state.player;
 const deathKey=key(p.x,p.y);
 const deathTile=getTile(p.x,p.y);
 const carried=allCarriedItems();
 const acme=carried.find(item=>item.name==='Acme Insurance');
 const insured=Boolean(acme||p.flags.insurance);

 if(insured){
  if(acme){
   removeFromCurrentLocation(acme);
   state.itemDiscard.push(acme);
  }
  p.flags.insurance=false;
  state.lastDeath=null;
  dropDeathItems(p,deathTile,deathKey,true);
  log('ACME Insurance grants you another life and returns you to Start.','heal');
  returnHeroToStart(p);
  showModal(
   'ACME INSURANCE PAYS OUT!',
   'You gain another life. All your items remain on the tile where you fell, and you awaken at Start with full Health and AP.',
   [{text:'Return to the Dungeon',cls:'green',fn:closeModal}]
  );
  return;
 }

 dropDeathItems(p,deathTile,deathKey,false);
 p.lives--;
 if(p.lives<=0){
  lose();
  return;
 }

 returnHeroToStart(p);
 log('You fall and wake at Start. Lives left: '+p.lives+'.','combat');
}
function closeCombat(){
 const finishedCombat=combat;

 if(finishedCombat?.restoreApAfterRanged&&state?.player){
  state.player.ap=state.player.maxAp;
 }

 document.getElementById('combat').classList.remove('open');
 document.body.classList.remove('combatActive','cinematicCombat');
 window.BOD3D?.endCombat?.();

 if(
  finishedCombat?.hadMeleeRound &&
  state?.player?.slots?.armour?.name==='Rusty Armour'
 ){
  const rusty=state.player.slots.armour;
  state.player.slots.armour=null;
  state.itemDiscard.push(rusty);
  syncEquipment();
  log('The Rusty Armour falls apart after the fight.','system');
  toast('Rusty Armour breaks!');
 }

 combat=null;
 if(state?.player)state.player.temp={};
}
function showMonsterStats(tileKey,event){if(event){event.preventDefault();event.stopPropagation();}if(boardInteractionLocked())return;const t=state.tiles[tileKey],m=t&&t.monster;if(!m||(m.health<=0)||!(m.revealed||m.peeked))return;playSound('click');const status=m.revealed?'Revealed':'Viewed with Magic Sword';const ringNote=t.hasRing?'<div style="margin-top:12px;font-weight:bold">This monster is guarding the Ring of Creation.</div>':'';showModal(m.name,'',[{text:'Close',fn:closeModal}]);document.getElementById('modalBody').innerHTML=`<div style="font-size:72px;line-height:1;margin-bottom:12px">${iconHTML(m.name,m.glyph||'👹')}</div><div><b>Health:</b> ${m.health} / ${m.maxHealth}</div><div><b>Combat:</b> ${m.dice}d6+${m.mod}</div><div><b>Status:</b> ${status}</div>${m.special?`<div style="margin-top:8px"><b>Special:</b> ${m.special}</div>`:''}${ringNote}`;}

// v11.19 split-file fix: death() is declared in this file, so its dice-cleanup
// wrapper must also be installed here after the function exists.
const deathWithoutDiceCleanup=death;
death=function(){window.BODDice3D?.clear?.();return deathWithoutDiceCleanup.apply(this,arguments);};

// Consolidated in TEST v12.69: Sirrus and Tamara's once-per-game Lethal Blow.
// Kept behaviour-identical to the previously verified standalone patch.
// BOD3D-TEST v11.44 — Sirrus and Tamara Lethal Blow as a simple armed icon
(function installLethalBlow(){
  function ready(){return typeof fightRound==='function'&&typeof resolveFightRound==='function'&&typeof renderCombat==='function';}
  function install(){
    if(window.__bodLethalBlowInstalled)return true;
    if(!ready())return false;
    window.__bodLethalBlowInstalled=true;
    const originalRenderCombat=renderCombat;
    const originalResolveFightRound=resolveFightRound;
    function fighterHasLethal(){return !!(state?.player&&state.player.flags?.special==='Lethal Blow');}
    function lethalReady(){return fighterHasLethal()&&!state.player.flags.usedSpecial;}
    window.toggleLethalBlow=function(){
      if(!combat||!lethalReady()||combat.rolling)return;
      combat.lethalBlowArmed=!combat.lethalBlowArmed;
      if(typeof playSound==='function')playSound('click');
      renderCombat();
    };
    fightRound=function(){
      if(!combat||combat.rolling)return;
      const p=state.player,m=combat.tile.monster;
      m.meleeStarted=true;combat.rolling=true;
      const useLethal=!!(combat.lethalBlowArmed&&lethalReady());
      const pr=roll(pDice()),mr=roll(m.dice);
      if(useLethal){
        const critical=isCritical(pr.rolls);
        const normalDice=critical?pr.total*2:pr.total;
        const modifier=pCombatMod();
        const normalTotal=normalDice+modifier;
        const doubledTotal=normalTotal*2;
        pr.total=(doubledTotal-modifier)/(critical?2:1);
        state.player.flags.usedSpecial=true;
        combat.lethalBlowArmed=false;
        playSound('critical');playCurrentTileEffect?.('critical',1000);
        log((state.charDef?.name||'The fighter')+' uses LETHAL BLOW! Combat total doubled from '+normalTotal+' to '+doubledTotal+'.','combat');
      }
      combat.pendingDiceRoll={pr,mr};
      showDice(Array.from({length:pDice()},()=>'?'),Array.from({length:m.dice},()=>'?'),true);
      document.getElementById('combatLog').textContent=useLethal?'LETHAL BLOW! Rolling doubled attack...':'Rolling dice...';
      playSound('dice');window.BODDice3D?.rollCombat?.(pr.rolls,mr.rolls);renderCombat();
      setTimeout(()=>{if(!combat)return;originalResolveFightRound();},1050);
    };
    renderCombat=function(){
      originalRenderCombat();
      if(!combat||!fighterHasLethal())return;
      const buttons=document.getElementById('combatBtns');if(!buttons)return;
      const icon=document.createElement('button');
      icon.type='button';icon.className='lethalIconBtn';icon.textContent='☠';
      icon.title='Lethal Blow — arm before rolling to double your total combat roll once per game';
      icon.setAttribute('aria-label',icon.title);
      if(state.player.flags.usedSpecial){icon.disabled=true;icon.classList.add('used');}
      else{icon.onclick=window.toggleLethalBlow;if(combat.lethalBlowArmed)icon.classList.add('armed');}
      buttons.appendChild(icon);
      const note=document.createElement('div');note.className='small lethalBlowStatus';
      note.textContent=state.player.flags.usedSpecial?'Lethal Blow used':(combat.lethalBlowArmed?'Lethal Blow armed — your next roll will be doubled':'Tap the skull to arm Lethal Blow before rolling');
      buttons.appendChild(note);
    };
    return true;
  }
  function start(){if(install())return;let tries=0;const timer=setInterval(()=>{if(install()||++tries>160)clearInterval(timer);},50);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

// Consolidated in TEST v12.70: free equipment swapping in the combat Items drawer.
// Behaviour remains identical to the previously verified standalone patch.
// BOD3D-TEST v11.85 — free equipment swapping in the combat Items drawer
(function(){
  let drawerOpen=false;
  let activeCombat=null;

  function carriedEntries(){
    if(typeof allCarriedItems!=='function')return [];
    return allCarriedItems()
      .map((item,index)=>({item,index}))
      .filter(({item})=>item&&(
        (item.use&&item.use!=='teleport') ||
        item.type==='equipment' ||
        (typeof isHandItem==='function'&&isHandItem(item)) ||
        (typeof isArmour==='function'&&isArmour(item)) ||
        (typeof isBoots==='function'&&isBoots(item)) ||
        (typeof isCloak==='function'&&isCloak(item))
      ));
  }

  function makeButton(text,className,onClick,disabled=false){
    const button=document.createElement('button');
    button.type='button';
    button.className=className;
    button.textContent=text;
    button.disabled=disabled;
    button.addEventListener('click',onClick);
    return button;
  }

  function refreshCombat(){
    if(typeof render==='function')render();
    if(typeof renderCombat==='function')renderCombat();
  }

  function equipmentAction(item,slot){
    if(combat?.rolling)return;
    if(equipToSlot(item,slot))refreshCombat();
  }

  function packItem(item){
    if(combat?.rolling)return;
    if(unequipItem(item)){
      if(typeof playSound==='function')playSound('unequip');
      if(typeof toast==='function')toast(item.name+' moved to backpack');
      refreshCombat();
    }
  }

  function addItemRow(drawer,item,index){
    const row=document.createElement('div');
    row.className='combatItemRow';

    const info=document.createElement('div');
    info.className='combatItemInfo';
    const name=document.createElement('strong');
    name.textContent=(item.icon?item.icon+' ':'')+item.name;
    info.appendChild(name);

    const equipped=typeof equippedSlotFor==='function'?equippedSlotFor(item):null;
    const status=document.createElement('small');
    status.textContent=equipped?'Equipped: '+equipped:'Backpack';
    info.appendChild(status);
    row.appendChild(info);

    const actions=document.createElement('div');
    actions.className='combatItemActions';
    const locked=!!combat?.rolling;

    const handItem=typeof isHandItem==='function'&&isHandItem(item);
    const twoHanded=handItem&&typeof isTwoHanded==='function'&&isTwoHanded(item);
    if(handItem){
      if(twoHanded){
        actions.appendChild(makeButton('Equip','combatItemAction',()=>equipmentAction(item,'left'),locked||equipped==='both hands'));
      }else{
        actions.appendChild(makeButton('Left','combatItemAction',()=>equipmentAction(item,'left'),locked||equipped==='left hand'));
        actions.appendChild(makeButton('Right','combatItemAction',()=>equipmentAction(item,'right'),locked||equipped==='right hand'));
      }
    }else if(typeof isArmour==='function'&&isArmour(item)){
      actions.appendChild(makeButton('Wear','combatItemAction',()=>equipmentAction(item,'armour'),locked||equipped==='armour'));
    }else if(typeof isBoots==='function'&&isBoots(item)){
      actions.appendChild(makeButton('Wear','combatItemAction',()=>equipmentAction(item,'boots'),locked||equipped==='boots'));
    }else if(typeof isCloak==='function'&&isCloak(item)){
      actions.appendChild(makeButton('Wear','combatItemAction',()=>equipmentAction(item,'cloak'),locked||equipped==='attire'));
    }

    if(item.use&&item.use!=='teleport'){
      actions.appendChild(makeButton('Use','combatItemAction combatItemUse',()=>{
        if(combat?.rolling)return;
        drawerOpen=false;
        useInventoryIndex(index);
      },locked));
    }

    if(equipped&&equipped!=='companion'){
      actions.appendChild(makeButton('Pack','combatItemAction combatItemPack',()=>packItem(item),locked));
    }

    row.appendChild(actions);
    drawer.appendChild(row);
  }

  function install(){
    if(window.__bodCombatItemsMenuInstalled)return true;
    if(
      typeof combatItemButtons!=='function' ||
      typeof useInventoryIndex!=='function' ||
      typeof renderCombat!=='function' ||
      typeof equipToSlot!=='function' ||
      typeof unequipItem!=='function'
    )return false;

    window.__bodCombatItemsMenuInstalled=true;

    combatItemButtons=function(wrap){
      if(!wrap)return;

      if(activeCombat!==combat){
        activeCombat=combat;
        drawerOpen=false;
      }

      const entries=carriedEntries();
      if(!entries.length)return;

      const toggle=makeButton(
        drawerOpen?'Items ▴':'Items ▾',
        'red combatItemsToggle',
        ()=>{
          drawerOpen=!drawerOpen;
          renderCombat();
        },
        !!combat?.rolling
      );
      toggle.setAttribute('aria-expanded',drawerOpen?'true':'false');
      wrap.appendChild(toggle);

      if(!drawerOpen)return;

      const drawer=document.createElement('div');
      drawer.id='combatItemsDrawer';
      drawer.className='combatItemsDrawer';

      const heading=document.createElement('div');
      heading.className='combatItemsHeading';
      heading.textContent='Equipment & Backpack';
      drawer.appendChild(heading);

      entries.forEach(({item,index})=>addItemRow(drawer,item,index));

      drawer.appendChild(makeButton('Close','combatItemChoice combatItemsClose',()=>{
        drawerOpen=false;
        renderCombat();
      }));

      wrap.appendChild(drawer);
    };

    return true;
  }

  function start(){
    if(install())return;
    let attempts=0;
    const timer=setInterval(()=>{
      if(install()||++attempts>200)clearInterval(timer);
    },50);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();

// Consolidated in TEST v12.71: verified combat placeholder and border cleanup.
// Behaviour and styling remain identical to the standalone patch.
// BOD3D-TEST v11.67 — remove combat placeholders without blocking controls
(function () {
  'use strict';

  if (window.__bodCombatCleanupV1166Installed) return;
  window.__bodCombatCleanupV1166Installed = true;

  const DICE_PLACEHOLDERS = new Set([
    'Dice will appear here.'
  ]);
  const LOG_PLACEHOLDERS = new Set([
    'Ready to fight!',
    'A monster blocks your path.'
  ]);

  function cleanCombatPlaceholders() {
    const dice = document.getElementById('diceTray');
    if (dice && DICE_PLACEHOLDERS.has(dice.textContent.trim())) {
      dice.textContent = '';
      dice.classList.add('combatTrayEmpty');
    } else if (dice && dice.textContent.trim() && dice.classList.contains('combatTrayEmpty')) {
      dice.classList.remove('combatTrayEmpty');
    }

    const log = document.getElementById('combatLog');
    if (log && LOG_PLACEHOLDERS.has(log.textContent.trim())) {
      log.textContent = '';
      log.classList.add('combatLogEmpty');
    } else if (log && log.textContent.trim() && log.classList.contains('combatLogEmpty')) {
      log.classList.remove('combatLogEmpty');
    }
  }

  function installStyles() {
    if (document.getElementById('bodCombatCleanupStylesV1166')) return;
    const style = document.createElement('style');
    style.id = 'bodCombatCleanupStylesV1166';
    style.textContent = `
      body.combatActive #side{
        border-right:0!important;
        box-shadow:none!important;
      }
      body.combatActive #combat,
      body.combatActive #combat .combatCard,
      body.combatActive .combatWideLayout,
      body.combatActive .combatGrid,
      body.combatActive .combatResolution,
      body.combatActive .diceTray,
      body.combatActive .combatLog{
        border-left:0!important;
        box-shadow:none!important;
      }
      body.combatActive .diceTray.combatTrayEmpty,
      body.combatActive .combatLog.combatLogEmpty{
        min-height:0!important;
        height:0!important;
        margin:0!important;
        padding:0!important;
        border:0!important;
        overflow:hidden!important;
      }
    `;
    document.head.appendChild(style);
  }

  function start() {
    installStyles();
    cleanCombatPlaceholders();

    const combat = document.getElementById('combat');
    if (!combat) return;
    new MutationObserver(cleanCombatPlaceholders).observe(combat, {
      subtree: true,
      childList: true,
      characterData: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();

