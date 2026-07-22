// Bag of Dungeon 3D — combat logic (melee, ranged attacks, monster charging, dice rolls,
// combat UI rendering, damage/impact effects, death/escape handling)
// Split out of index.html for easier editing. Depends on state/helpers from game.js, so
// this must load AFTER game.js.

function pCombatMod(){const e=state.player.equipment;return state.player.baseMod+applyEquipmentStats(e.weapon)}
function pDamageReduction(){const e=state.player.equipment;return applyEquipmentStats(e.armour)+applyEquipmentStats(e.shield)}
function pDice(){return state.player.baseDice+(state.player.equipment.bear?1:0)+(state.player.temp.strength?1:0)}
function openCombat(tile,options={}){
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
  if(combat&&combat.tile===tile)combatElement.classList.add('open');
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
  const distance=allowCorners?connectedDistance(from,kk,range):straightCorridorDistance(from,kk,range);
  if(distance>=1&&distance<=range)out.push({key:kk,distance});
 }
 return out;
}
function startRangedAttack(type,item=null,consume=null){
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
  range=3;
  cost=2;
  label='Fireball';
 }else if(type==='daggers'){
  if(!item||item.use!=='daggers'){
   toast('Carry Flying Daggers first');
   return;
  }
  range=3;
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
   playSound('bow');
   playTileEffect(tileKey,'arrow',700);
   setTimeout(()=>playSound('arrowHit'),120);
  }else if(attack.type==='iceStaff'){
   weaponName='Ice Staff';
   damage=roll(2).total;
   playSound('spell');
   window.BOD3D?.playEffect?.('ice',tileKey);
  }else if(attack.type==='fireball'){
   weaponName='Fireball';
   damage=roll(3).total;
   playSound('spell');
   window.BOD3D?.playEffect?.('fireball',tileKey);
   attack.consume?.();
  }else if(attack.type==='daggers'){
   weaponName='Flying Daggers';
   damage=roll(2).total;
   playSound('spell');
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
    noEscape:true,
    sourceKey:heroTileKey,
    chargedFromKey:tileKey
   });
   render();
  },1450);
 },520);
}
function renderCombat(){if(!combat)return;const p=state.player,m=combat.tile.monster,c=state.charDef||CHARACTERS[0];document.getElementById('heroGlyph').innerHTML=iconHTML(c.name,c.glyph||'🧑');const heroNameEl=document.getElementById('heroCombatName');if(heroNameEl)heroNameEl.textContent=c.name;document.getElementById('heroCombatStats').innerHTML='<div class="hearts">'+heartLine(p.health,p.maxHealth)+'</div><div>HP '+p.health+'/'+p.maxHealth+'</div><div>Combat '+pDice()+'d6+'+pCombatMod()+'</div><div>Damage reduction -'+pDamageReduction()+'</div><div>AP '+p.ap+'/'+p.maxAp+'</div>';document.getElementById('monsterGlyph').innerHTML=iconHTML(m.name,m.glyph||'👹');document.getElementById('monsterName').textContent=m.name;document.getElementById('monsterCombatStats').innerHTML='<div class="hearts combatHearts">'+heartLine(m.health,m.maxHealth)+'</div><div>HP '+m.health+'/'+m.maxHealth+'</div><div>Combat '+m.dice+'d6+'+m.mod+'</div><div class="small">Monsters never score critical hits.</div><div class="small">'+(m.special||'')+'</div>';const b=document.getElementById('combatBtns');b.innerHTML='';addBtn(b,combat.rolling?'Rolling...':'Fight','green',fightRound,combat.rolling);addBtn(
 b,
 combat.noEscape
  ?'No Escape!'
  :(combat.mustFightRound?'Run Away — fight first':'Run Away (-1 HP)'),
 'red',
 runAway,
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
 window.BOD3D?.combatPulse?.();
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
 let pt=(crit?diceScore*2:diceScore)+pCombatMod();
 let mt=mr.total+m.mod;
 if(p.flags.reroll){
   p.flags.reroll=false;
   pr=roll(pDice());
   crit=isCritical(pr.rolls);
   diceScore=pr.total;
   pt=(crit?diceScore*2:diceScore)+pCombatMod();
   log("Imp's Teeth reroll used.",'loot');
 }
 showDice(pr.rolls,mr.rolls,false);
 let text='You rolled '+pr.rolls.join(', ')+' = '+pr.total+(crit?' — CRITICAL! dice score doubled to '+(pr.total*2):'')+' + '+pCombatMod()+' = '+pt+'. Monster rolled '+mr.rolls.join(', ')+' = '+mr.total+' + '+m.mod+' = '+mt+'. ';
 let damageToMonster=0,damageToHero=0;
 const deadeye=p.special==='Dead-eye'&&pr.rolls.includes(6);
 if(deadeye){damageToMonster=Math.max(0,m.health);m.health=0;text+='Dead-eye! Instant kill.';}
 else if(pt>mt){let dmg=pt-mt;if(m.isDragon&&p.equipment.dragonlance){const extra=roll(3).total;dmg+=extra;text+='Dragonlance adds '+extra+' damage. ';}damageToMonster=dmg;m.health-=dmg;text+='You hit for '+dmg+'.';}
 else if(mt>pt){if(combat.monsterSkip){combat.monsterSkip=false;text+=m.name+' is held and misses.';}else{let dmg=Math.max(0,mt-pt-pDamageReduction());damageToHero=dmg;p.health-=dmg;text+=m.name+' hits for '+dmg+'.';if(dmg>0&&p.equipment.bear){text+=' Loyal Bear is defeated protecting you.';if(p.companionBear)state.itemDiscard.push(p.companionBear);p.companionBear=null;syncEquipment();}}}
 else{text+='Both miss.';}
 combat.rolling=false;
 combat.mustFightRound=false;
 document.getElementById('combatLog').textContent=text;
 log(text,'combat');
 if(crit){playSound('sword');playSound('critical');playCurrentTileEffect('critical',850);showCombatImpact('monster',m.health<=0?'kill':'critical',damageToMonster);}
 else if(damageToMonster>0){playSound('sword');playCurrentTileEffect('hit',650);showCombatImpact('monster',m.health<=0?'kill':'hit',damageToMonster);}
 else if(mt>pt){playSound('hit');showCombatImpact('hero',p.health<=0?'kill':'hit',damageToHero);}
 else{showCombatImpact('monster','miss',0);}
 if(m.health<=0){log('KILLING BLOW: your total of '+pt+' defeats the '+m.name+' (monster total '+mt+').','combat');setTimeout(()=>killMonster(),combatImpactDuration('kill'));return;}
 if(p.health<=0){playSound('heroHurt');log('FATAL BLOW: '+m.name+' scores '+mt+' against your '+pt+' and defeats you.','combat');setTimeout(()=>death(),combatImpactDuration('kill'));return;}
 if(mt>pt)playSound('heroHurt');
 render();renderCombat();
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

function killMonster(){const m=combat.tile.monster;const tileKey=combat.sourceKey||key(state.player.x,state.player.y);playSound('monsterDie');playTileEffect(tileKey,'monsterDeath',1000);log('Defeated '+m.name+'.','combat');state.player.killed.push(m.name);state.monsterDiscard.push(m);recordMonsterCorpse(combat.tile,tileKey,m);combat.tile.monster=null;if(!m.isDragon){collectRingIfSafe(tileKey);}if(m.isDragon&&state.player.hasRing){win();return;}if(!m.isDragon){const startingHealth=m.maxHealth;const rewardCount=startingHealth>=10?2:(startingHealth>=6?1:0);if(rewardCount===0){log(m.name+' had '+startingHealth+' starting Health: no item reward.','system');}else{log(m.name+' had '+startingHealth+' starting Health: draw '+rewardCount+' item'+(rewardCount===1?'':'s')+'.','loot');for(let i=0;i<rewardCount;i++)awardItem();}}closeCombat();render();}
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
 if(p.health<=0){death();return;}

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

function death(){const p=state.player;const carried=allCarriedItems();const acme=carried.find(it=>it.name==='Acme Insurance');if(!TESTER_SINGLE_LIFE&&(p.flags.insurance||acme)){if(acme){removeFromCurrentLocation(acme);state.itemDiscard.push(acme);}p.flags.insurance=false;p.health=p.maxHealth;p.x=0;p.y=0;p.facing='S';log('Acme Insurance saves you and lets you keep your items!','heal');closeCombat();render();centreOnHero();return;}const killedByDragon=!!(combat&&combat.tile&&combat.tile.monster&&combat.tile.monster.isDragon);const droppable=carried.filter(it=>!isBear(it));if(droppable.length){let targetTile;if(killedByDragon){targetTile=healingPoolTile();if(targetTile){log('The Dragon defeats you. Your items are transferred to the Healing Pool.','combat');}else{targetTile=getTile(p.x,p.y);log('The Dragon defeats you. No Healing Pool is available, so your items remain at the Exit.','combat');}}else{targetTile=getTile(p.x,p.y);log('Your items drop on the tile where you fell.','combat');}if(targetTile){targetTile.droppedItems=targetTile.droppedItems||[];targetTile.droppedItems.push(...droppable);}clearPlayerItems();}p.lives--;if(p.lives<=0){lose();return;}p.health=p.maxHealth;p.x=0;p.y=0;p.facing='S';p.hasRing=false;log('You fall and wake at Start. Lives left: '+p.lives+'.','combat');closeCombat();window.BOD3D?.snapHeroToPlayer?.();render();centreOnHero(false);setTimeout(()=>{window.BOD3D?.snapHeroToPlayer?.();render();centreOnHero(true);window.BOD3D?.centreOnHero?.();},120);}
function closeCombat(){
 const finishedCombat=combat;

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
