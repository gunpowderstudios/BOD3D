// Bag of Dungeon 3D — core game logic (characters, decks, tiles, movement, inventory, items, saving)
// Split out of index.html for easier editing. Loads before combat.js and scene3d.js.

const VERSION='v11.23';

const CHARACTERS=[
 {id:'sirrus',name:'Sirrus the Fighter',glyph:'⚔',desc:'Skilled warrior and renowned blade-master.',maxHealth:10,maxAp:5,baseDice:2,baseMod:2,special:'Lethal Blow',specialDesc:'Once per game you may double your combat roll result.'},
 {id:'tamara',name:'Tamara the Fighter',glyph:'⚔',desc:'Fearless sword fighter.',maxHealth:10,maxAp:5,baseDice:2,baseMod:2,special:'Lethal Blow',specialDesc:'Once per game you may double your combat roll result.'},
 {id:'duric',name:'Duric the Dwarf',glyph:'🪓',desc:'Former head of the King\'s Guard.',maxHealth:12,maxAp:4,baseDice:2,baseMod:3,special:'Brace',specialDesc:'Once per game block an attack and take no damage.'},
 {id:'marria',name:'Marria the Dwarf',glyph:'🪓',desc:'Stout-hearted and legendary with an axe.',maxHealth:12,maxAp:4,baseDice:2,baseMod:3,special:'Brace',specialDesc:'Once per game block an attack and take no damage.'},
 {id:'rill',name:'Rill the Healer',glyph:'✋',desc:'Wise in the lore of medicine.',maxHealth:9,maxAp:5,baseDice:2,baseMod:0,special:'Renew',specialDesc:'Spend 3 AP to heal 2 dice of health. Three uses per game.'},
 {id:'tarak',name:'Tarak the Healer',glyph:'✋',desc:'A healer of wounds and woes.',maxHealth:9,maxAp:5,baseDice:2,baseMod:0,special:'Renew',specialDesc:'Spend 3 AP to heal 2 dice of health. Three uses per game.'},
 {id:'alendra',name:'Alendra the Elf',glyph:'🏹',desc:'Fleet-footed and keen-eyed.',maxHealth:9,maxAp:6,baseDice:2,baseMod:1,special:'Dead-eye',specialDesc:'Natural 6 in combat gives an instant kill.'},
 {id:'galhorn',name:'Galhorn the Elf',glyph:'🏹',desc:'Master archer, quick and sharp.',maxHealth:9,maxAp:6,baseDice:2,baseMod:1,special:'Dead-eye',specialDesc:'Natural 6 in combat gives an instant kill.'}
];
let selectedCharacterIndex=0;
let heroSelectorBusy=false;
let queuedHeroDirection=0;
function selectedCharacter(){return CHARACTERS[selectedCharacterIndex]||CHARACTERS[0];}
function waitMs(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
function setHeroSelectorBusy(busy){
 heroSelectorBusy=busy;
 document.querySelectorAll('.heroArrow').forEach(btn=>btn.classList.toggle('selectorBusy',busy));
}
function updateHeroInfo(c){
 const panel=document.getElementById('heroInfoPanel');
 panel.classList.remove('changing');void panel.offsetWidth;panel.classList.add('changing');
 document.getElementById('selectedHeroName').textContent=c.name;
 document.getElementById('selectedHeroDesc').textContent=c.desc;
 document.getElementById('selectedHeroHealth').textContent=c.maxHealth;
 document.getElementById('selectedHeroAP').textContent=c.maxAp;
 document.getElementById('selectedHeroCombat').textContent=c.baseDice+'d6+'+c.baseMod;
 document.getElementById('selectedHeroSpecial').textContent=c.special;
 document.getElementById('selectedHeroSpecialDesc').textContent=c.specialDesc;
 const fallback=document.getElementById('heroPreviewFallback');
 fallback.innerHTML=iconHTML(c.name,c.glyph);
 const dots=document.getElementById('heroDots');
 dots.innerHTML=CHARACTERS.map((_,i)=>'<button type="button" class="heroDot '+(i===selectedCharacterIndex?'active':'')+'" data-hero-index="'+i+'" aria-label="Choose hero '+(i+1)+'"></button>').join('');
}
async function updateCharacterSelection(direction=0){
 direction=Math.sign(Number(direction)||0);
 if(heroSelectorBusy){
  if(direction)queuedHeroDirection=direction;
  return;
 }
 const wrap=document.getElementById('heroPreviewWrap');
 if(!direction){
  updateHeroInfo(selectedCharacter());
  if(window.BODHeroPreview)await window.BODHeroPreview.select(selectedCharacter());
  return;
 }
 setHeroSelectorBusy(true);
 const leavingClass=direction>0?'heroLeavingLeft':'heroLeavingRight';
 const enteringClass=direction>0?'heroEnteringRight':'heroEnteringLeft';
 wrap.classList.remove('heroEnteringLeft','heroEnteringRight','heroLeavingLeft','heroLeavingRight');
 wrap.classList.add(leavingClass);
 await waitMs(280);
 selectedCharacterIndex=(selectedCharacterIndex+direction+CHARACTERS.length)%CHARACTERS.length;
 const c=selectedCharacter();
 updateHeroInfo(c);
 if(window.BODHeroPreview)await window.BODHeroPreview.select(c);
 wrap.classList.remove(leavingClass);
 void wrap.offsetWidth;
 wrap.classList.add(enteringClass);
 await waitMs(440);
 wrap.classList.remove(enteringClass);
 setHeroSelectorBusy(false);
 if(queuedHeroDirection){
  const queued=queuedHeroDirection;
  queuedHeroDirection=0;
  updateCharacterSelection(queued);
 }
}
function renderCharSelect(){
 updateCharacterSelection(0);
 const prev=document.getElementById('prevHeroBtn');
 const next=document.getElementById('nextHeroBtn');
 const choose=document.getElementById('chooseHeroBtn');
 if(prev&&!prev.dataset.wired){prev.dataset.wired='1';prev.onclick=()=>updateCharacterSelection(-1);}
 if(next&&!next.dataset.wired){next.dataset.wired='1';next.onclick=()=>updateCharacterSelection(1);}
 if(choose&&!choose.dataset.wired){choose.dataset.wired='1';choose.onclick=()=>{if(!heroSelectorBusy)startGame(selectedCharacter());};}
 const dots=document.getElementById('heroDots');
 if(dots&&!dots.dataset.wired){dots.dataset.wired='1';dots.addEventListener('click',e=>{const b=e.target.closest('[data-hero-index]');if(!b)return;selectedCharacterIndex=Number(b.dataset.heroIndex)||0;updateCharacterSelection(0);});}
 if(!document.body.dataset.heroKeysWired){
  document.body.dataset.heroKeysWired='1';
  document.addEventListener('keydown',e=>{
   const select=document.getElementById('charSelect');
   if(!select||select.classList.contains('hidden'))return;
   if(e.key==='ArrowLeft')updateCharacterSelection(-1);
   if(e.key==='ArrowRight')updateCharacterSelection(1);
   if(e.key==='Enter'&&!heroSelectorBusy)startGame(selectedCharacter());
  });
 }
}

(function wireHeroSwipe(){
 const wrap=document.getElementById('heroPreviewWrap');
 if(!wrap||wrap.dataset.swipeWired)return;
 wrap.dataset.swipeWired='1';
 let startX=0,startY=0,tracking=false;
 wrap.addEventListener('touchstart',e=>{
  if(e.touches.length!==1||heroSelectorBusy)return;
  startX=e.touches[0].clientX;startY=e.touches[0].clientY;tracking=true;
 },{passive:true});
 wrap.addEventListener('touchend',e=>{
  if(!tracking||heroSelectorBusy)return;
  tracking=false;
  const touch=e.changedTouches[0];
  const dx=touch.clientX-startX,dy=touch.clientY-startY;
  if(Math.abs(dx)<54||Math.abs(dx)<Math.abs(dy)*1.35)return;
  updateCharacterSelection(dx<0?1:-1);
 },{passive:true});
})();

function startGame(c){
 audio();
 if(window.BODHeroPreview)window.BODHeroPreview.pause();
 document.getElementById('charSelect').classList.add('hidden');
 newGame(c);
}
function showCharSelect(){
 document.body.classList.remove('combatActive');closeModal();closeCombat();
 // Returning from Game Over/New Game: explicitly hand audio back to the
 // character/loading screen. This runs from the player's button tap, so it
 // also satisfies mobile browser audio-interaction requirements.
 if(window.stopDungeonAmbience)window.stopDungeonAmbience();
 if(window.startDistantMonstersAmbience)window.startDistantMonstersAmbience();
 document.getElementById('charSelect').classList.remove('hidden');
 renderCharSelect();
 if(window.BODHeroPreview)window.BODHeroPreview.resume();
}

const TILE=128,GAP=0,STEP=TILE+GAP;
const DIRS={N:{dx:0,dy:-1,opp:'S'},E:{dx:1,dy:0,opp:'W'},S:{dx:0,dy:1,opp:'N'},W:{dx:-1,dy:0,opp:'E'}};
const dirOrder=['N','E','S','W'];
const TILE_BASE={straight:{N:1,S:1,E:0,W:0},corner:{N:1,E:1,S:0,W:0},t:{N:1,E:1,W:1,S:0},cross:{N:1,E:1,S:1,W:1},spike:{N:1,S:1,E:0,W:0},pool:{N:1,E:1,S:1,W:1},exit:{N:1,E:1,S:1,W:1},start:{N:1,E:1,S:1,W:1}};
const TILE_LABEL={straight:'Straight',corner:'Corner',t:'T-Junction',cross:'Crossroad',spike:'Spike Trap',pool:'Healing Pool',exit:'Exit'};
const TILE_GLYPH={spike:'▲',pool:'💧',exit:'🚪'};
const MONSTER_MASTER=[
 {name:'Goblin',copies:5,dice:1,mod:1,maxHealth:5,glyph:'👺'}, {name:'Zombie',copies:4,dice:1,mod:2,maxHealth:6,glyph:'☠'},
 {name:'Mummy',copies:2,dice:1,mod:4,maxHealth:7,glyph:'▣'}, {name:'Monk',copies:3,dice:2,mod:4,maxHealth:8,glyph:'♟'},
 {name:'Mud Monster',copies:2,dice:2,mod:2,maxHealth:9,glyph:'♨'}, {name:'Werewolf',copies:2,dice:2,mod:3,maxHealth:10,glyph:'♞'},
 {name:'Troll',copies:3,dice:2,mod:4,maxHealth:10,glyph:'♜'}, {name:'Minotaur',copies:1,dice:2,mod:5,maxHealth:11,glyph:'♉'},
 {name:'Skeleton',copies:2,dice:2,mod:1,maxHealth:12,glyph:'☠'}, {name:'Giant Snake',copies:2,dice:2,mod:6,maxHealth:13,glyph:'🐍'},
 {name:'Reacher',copies:1,dice:2,mod:7,maxHealth:15,glyph:'☣',special:'Sting range 4. Half damage to all.'},
 {name:'Mirror Monster',copies:2,dice:0,mod:0,maxHealth:0,glyph:'◈',special:'Mirrors your current Health & Combat.'}
];
const ITEM_MASTER=[
 {name:'Rusty Armour',copies:1,type:'equipment',slot:'armour',icon:'▤',desc:'One fight: -1 damage from attacks, then discard.'},
 {name:'Steel Armour',copies:1,type:'equipment',slot:'armour',icon:'▥',desc:'-1 damage from attacks.'},
 {name:'Magic Armour',copies:1,type:'equipment',slot:'armour',icon:'▦',desc:'-2 damage from attacks.'},
 {name:'Magic Boots',copies:2,type:'equipment',slot:'boots',icon:'👢',desc:'+1 AP each turn.',apply:p=>{if(!p.equipment.boots){p.maxAp+=1;p.ap+=1;}p.equipment.boots={name:'Magic Boots',icon:'👢',value:1};}},
 {name:'Teleport Crystal',copies:1,type:'spell',icon:'◆',desc:'1 use: teleport to any revealed tile.',use:'teleport'},
 {name:'Acme Insurance',copies:1,type:'other',icon:'☂',desc:'Used automatically on defeat: keep items and revive once.',apply:p=>{p.flags.insurance=true;p.other.push({name:'Acme Insurance',icon:'☂',desc:'Auto revive / keep items.'});}},
 {name:"Imp's Teeth",copies:1,type:'consumable',icon:'☷',desc:'1 use: reroll your next combat roll.',use:'reroll'},
 {name:'Torch',copies:1,type:'equipment',slot:'tool',icon:'🔥',desc:'Lay 2 dungeon tiles for 1 AP.',apply:p=>{p.equipment.torch={name:'Torch',icon:'🔥',value:1};}},
 {name:'Flying Daggers',copies:1,type:'spell',icon:'✣',desc:'One-use ranged spell. Range 1-3; spend 2 AP and roll 2 dice damage. Can fly around connected corners. Hidden or revealed monsters may be targeted. If it survives, it charges and there is no escape. The Dragon is immune.',use:'daggers'},
 {name:'Steel Sword',copies:1,type:'equipment',slot:'weapon',icon:'⚔',desc:'+1 combat roll.'},
 {name:"Sorcerer's Skull",copies:1,type:'spell',icon:'☠',desc:'1 use: 1 dice damage to all on tile.',use:'skull'},
 {name:'Magic Sword',copies:1,type:'equipment',slot:'weapon',icon:'🗡',desc:'+2 combat roll. View adjacent monster.'},
 {name:'Bow',copies:1,type:'equipment',slot:'bow',icon:'🏹',desc:'Two-handed. Range 1-3. Spend 3 AP for 1 die ranged damage. May target hidden or revealed monsters. If it survives, it charges into melee. The Dragon is immune.',apply:p=>{p.equipment.bow={name:'Bow',icon:'🏹',dice:1,bonus:0};}},
 {name:'Small Chest',copies:1,type:'consumable',icon:'□',desc:'Chest: may be trapped, may contain an item. Open it to roll the die.',use:'smallChest'},
 {name:'Large Chest',copies:1,type:'consumable',icon:'▣',desc:'Chest: may be trapped, may contain items. Open it to roll the die.',use:'largeChest'},
 {name:'Vampire Teeth',copies:1,type:'spell',icon:'⌇',desc:'1 use: drain and gain 5 health.',use:'vampire'},
 {name:"Witch's Claw",copies:1,type:'spell',icon:' claw',desc:'1 use: weaken the current monster.',use:'claw'},
 {name:'Elven Bow',copies:1,type:'equipment',slot:'bow',icon:'➶',desc:'Two-handed. Range 1-3. Spend 3 AP for 1 die +2 ranged damage. May target hidden or revealed monsters. If it survives, it charges into melee. The Dragon is immune.',apply:p=>{p.equipment.bow={name:'Elven Bow',icon:'➶',dice:1,bonus:2};}},
 {name:'Fireball',copies:1,type:'spell',icon:'☄',desc:'1 use, 2 AP: 3 dice damage to monster.',use:'fireball'},
 {name:'Steel Shield',copies:1,type:'equipment',slot:'shield',icon:'◫',desc:'-1 damage from attacks.'},
 {name:'Magic Shield',copies:1,type:'equipment',slot:'shield',icon:'⬟',desc:'-2 damage from attacks.'},
 {name:'Strength Potion',copies:1,type:'consumable',icon:'▲',desc:'1 use: +1 combat die for one fight.',use:'strengthPotion'},
 {name:'Health Potion',copies:2,type:'consumable',icon:'♥',desc:'1 use: regain 2 dice of health.',use:'healthPotion'},
 {name:'Ice Staff',copies:1,type:'equipment',slot:'staff',icon:'❄',desc:'Permanent. Range 1-2. Spend 4 AP for 2 dice ranged damage. May target hidden or revealed monsters. If it survives, it charges into melee. The Dragon is immune.',use:'iceStaff',apply:p=>{p.equipment.staff={name:'Ice Staff',icon:'❄',dice:2,cost:4};}},
 {name:'Small Axe',copies:1,type:'equipment',slot:'weapon',icon:'⛏',desc:'+1 combat roll.'},
 {name:'Iron Axe',copies:1,type:'equipment',slot:'weapon',icon:'⚒',desc:'+2 combat roll.'},
 {name:'Large Steel Axe',copies:1,type:'equipment',slot:'weapon',icon:'🪓',desc:'Two-handed. +3 combat roll.'},
 {name:'Invisibility Cloak',copies:1,type:'equipment',slot:'cloak',icon:'◌',desc:'Walk past normal monsters without fighting. Does not work on Dragon.',apply:p=>{p.equipment.cloak={name:'Invisibility Cloak',icon:'◌'};}},
 {name:'Bomb',copies:2,type:'spell',icon:'●',desc:'1 use, 1 AP: 2 dice damage to current monster.',use:'bomb'},
 {name:'Tornado',copies:1,type:'spell',icon:'↻',desc:'1 use, 1 AP: move away from current monster without losing HP.',use:'tornado'},
 {name:'Morning Star',copies:1,type:'equipment',slot:'weapon',icon:'✹',desc:'+2 combat roll.'},
 {name:'Dragonlance',copies:1,type:'equipment',slot:'dragonlance',icon:'♜',desc:'One-handed. Against Dragon only: +3 dice damage.',apply:p=>{p.equipment.dragonlance={name:'Dragonlance',icon:'♜'};}},
 {name:'Loyal Bear',copies:1,type:'equipment',slot:'bear',icon:'🐻',desc:'+1 combat die until defeated. Takes no inventory space.',apply:p=>{p.equipment.bear={name:'Loyal Bear',icon:'🐻'};}},
 {name:'Magic Vine',copies:1,type:'spell',icon:'♧',desc:'1 use, 1 AP: 1 dice damage and monster skips its next attack.',use:'vine'}
];

/* ===== Asset Engine v5.0 =====
   Default graphics load from /assets using assets/assets.js.
   Browser uploads remain available as temporary local overrides.
   To change a default on GitHub, overwrite the matching PNG and refresh. */
// Built-in external asset paths. assets/assets.js may override or extend these.
// M2-M12 are NOT separate PNG files: they use a normal floor tile with an M-number overlay.
const BUILTIN_ASSET_PATHS={
 'Start':'assets/tiles/start.png',
 'Exit':'assets/tiles/exit.png',
 'Straight':'assets/tiles/straight.png',
 'Corner':'assets/tiles/corner.png',
 'T-Junction':'assets/tiles/tjunction.png',
 'Crossroad':'assets/tiles/crossroad.png',
 'Spike Trap':'assets/tiles/spiketrap.png',
 'Healing Pool':'assets/tiles/healingpool.png',
 'Item Marker':'assets/ui/item.png',
 'Ring':'assets/ui/ring.png',
 'Hidden Monster':'assets/ui/hiddenmonster.png'
};
const DEFAULT_ASSETS={...BUILTIN_ASSET_PATHS,...(window.ASSET_PATHS||{})};
// Backwards compatibility only: old builds called this an Item Tile.
// The player-facing Asset Manager now shows only Item Marker and loads assets/ui/item.png.
DEFAULT_ASSETS['Item Tile']=DEFAULT_ASSETS['Item Marker'];
// Effect files may be static transparent PNGs or animated APNGs.
// Optional window.EFFECT_PATHS entries in assets/assets.js can point to GIF/WebP files instead.
const DEFAULT_EFFECT_PATHS={
 arrow:'assets/effects/arrow.png', ice:'assets/effects/ice.png', hit:'assets/effects/hit.png',
 critical:'assets/effects/critical.png', monsterDeath:'assets/effects/monster-death.png',
 heal:'assets/effects/heal.png', teleport:'assets/effects/teleport.png', trap:'assets/effects/trap.png',
 ring:'assets/effects/ring.png', dragon:'assets/effects/dragon.png', fireball:'assets/effects/fireball.png',
 explosion:'assets/effects/explosion.png'
};
const EFFECT_PATHS={...DEFAULT_EFFECT_PATHS,...(window.EFFECT_PATHS||{})};
function effectSrc(name){return EFFECT_PATHS[name]||'';}
function playTileEffect(tileKey,name,duration=850){const src=effectSrc(name);if(!src)return;const tile=document.querySelector(`.tile[data-tile-key="${tileKey}"]`);if(!tile)return;const layer=document.createElement('span');layer.className='effectLayer';const img=document.createElement('img');img.src=src;img.alt='';img.onerror=()=>layer.remove();layer.appendChild(img);tile.appendChild(layer);setTimeout(()=>layer.remove(),duration);}
function playCurrentTileEffect(name,duration=850){if(!state||!state.player)return;playTileEffect(key(state.player.x,state.player.y),name,duration);}
function playScreenEffect(name,duration=1000){const src=effectSrc(name);if(!src)return;const layer=document.createElement('div');layer.className='screenEffect';const img=document.createElement('img');img.src=src;img.alt='';img.onerror=()=>layer.remove();layer.appendChild(img);document.body.appendChild(layer);setTimeout(()=>layer.remove(),duration);}

// Item art convention: put transparent PNGs in assets/items/.
// Example: Torch -> assets/items/torch.png; Sorcerer's Skull -> assets/items/sorcerers-skull.png.
function itemAssetFilename(name){return String(name||'').toLowerCase().replace(/[’']/g,'').replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'.png';}
function monsterAssetFilename(name){
 if(name==='Red Dragon')return 'dragon.png';
 return String(name||'').toLowerCase().replace(/[’']/g,'').replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'.png';
}

// GLB models are optional. Monsters not listed here continue to use their PNG artwork.
// Add future models by adding another line, for example:
// 'Skeleton':'assets/models/monsters/skeleton.glb'
// All GLB models live in one folder: assets/models/
// Short filenames are used deliberately.
// Character IDs already provide the short names: sirrus.glb, tamara.glb, duric.glb, etc.
const MONSTER_MODEL_FILES={
 'Goblin':'goblin.glb',
 'Zombie':'zombie.glb',
 'Mummy':'mummy.glb',
 'Monk':'monk.glb',
 'Mud Monster':'mud-monster.glb',
 'Werewolf':'werewolf.glb',
 'Troll':'troll.glb',
 'Minotaur':'minotaur.glb',
 'Skeleton':'skeleton.glb',
 'Giant Snake':'giant-snake.glb',
 'Reacher':'reacher.glb',
 'Mirror Monster':'mirror-monster.glb',
 'Red Dragon':'dragon.glb'
};
function monsterModelFile(name){return MONSTER_MODEL_FILES[name]||'';}

const HERO_MODEL_FILES={
 sirrus:'sirrus.glb',
 tamara:'tamara.glb',
 duric:'duric.glb',
 marria:'marria.glb',
 rill:'rill.glb',
 tarak:'tarak.glb',
 alendra:'alendra.glb',
 galhorn:'galhorn.glb'
};

function characterModelFile(character){
 if(!character)return '';
 const id=String(character.id||'').trim().toLowerCase();
 return HERO_MODEL_FILES[id]||`${id}.glb`;
}
function modelPath(file){return file?'assets/models/'+file:'';}

// Physical miniature heights taken from the original Bag of Dungeon sculpts.
// Sirrus (41 mm) remains the visual baseline used by the earlier renderer.
const MODEL_HEIGHT_MM={
 sirrus:41,
 duric:37,
 alendra:52,
 galhorn:51,
 marria:37,
 rill:42,
 tamara:39,
 tarak:43,

 goblin:50,
 minotaur:47,
 'mirror-monster':35,
 monk:55,
 'mud-monster':44,
 mummy:46,
 reacher:71,
 skeleton:52,
 'giant-snake':58,
 snake:58,
 troll:50,
 werewolf:49,
 zombie:44,
 zombie2:44,
 dragon:43
};

const MODEL_BASELINE_MM=41;
const MODEL_BASELINE_SCENE_HEIGHT=1.62; // original game-board miniature scale restored

function modelKeyFromPath(path){
 const clean=String(path||'').split('?')[0];
 const file=clean.substring(clean.lastIndexOf('/')+1);
 return file.replace(/\.glb$/i,'').toLowerCase();
}
function targetSceneHeightForModel(path){
 const key=modelKeyFromPath(path);
 const mm=MODEL_HEIGHT_MM[key]||MODEL_BASELINE_MM;
 return MODEL_BASELINE_SCENE_HEIGHT*(mm/MODEL_BASELINE_MM);
}

function monsterBoardHTML(monster,rangedClass='',tileKey=''){
 return `<span class="mark monsterGlyph${rangedClass}" role="button" tabindex="0" data-monster-key="${tileKey}" aria-label="View ${monster.name} stats" title="Click to view ${monster.name} stats">${iconHTML(monster.name,monster.glyph)}</span>`;
}
function heroBoardHTML(character){return iconHTML(character.name,character.glyph);}
function wireBoardModels(){}

function heroAssetFilename(name){
 return String(name||'').toLowerCase().replace(/[’']/g,'').replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'.png';
}
ITEM_MASTER.forEach(item=>{if(!DEFAULT_ASSETS[item.name])DEFAULT_ASSETS[item.name]='assets/items/'+itemAssetFilename(item.name);});
CHARACTERS.forEach(hero=>{if(!DEFAULT_ASSETS[hero.name])DEFAULT_ASSETS[hero.name]='assets/heroes/'+heroAssetFilename(hero.name);});
MONSTER_MASTER.forEach(monster=>{if(!DEFAULT_ASSETS[monster.name])DEFAULT_ASSETS[monster.name]='assets/monsters/'+monsterAssetFilename(monster.name);});
if(!DEFAULT_ASSETS['Red Dragon'])DEFAULT_ASSETS['Red Dragon']='assets/monsters/dragon.png';
let USER_ASSETS={};
function assetKey(name){return String(name||'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function loadAssets(){
 try{USER_ASSETS=JSON.parse(localStorage.getItem('bodDigitalAssetsV25')||'{}')}catch(e){USER_ASSETS={}}
 // Migrate any old uploaded Item Tile artwork to the new Item Marker name.
 if(USER_ASSETS['item-tile']&&!USER_ASSETS['item-marker']){
  USER_ASSETS['item-marker']=USER_ASSETS['item-tile'];
  delete USER_ASSETS['item-tile'];
  saveAssets();
 }
}
function saveAssets(){localStorage.setItem('bodDigitalAssetsV25',JSON.stringify(USER_ASSETS))}
function assetSrc(name){const k=assetKey(name);return USER_ASSETS[k]||DEFAULT_ASSETS[name]||DEFAULT_ASSETS[k]||''}
window.assetSrc=assetSrc;
function iconHTML(name,fallback){const src=assetSrc(name);const fb=String(fallback||'?').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');return src?`<span class="spriteWrap"><img class="spriteIcon" src="${src}" alt="${name}" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span style="display:none">${fb}</span></span>`:(fallback||'?')}
function assetNames(){
 const names=[];
 CHARACTERS.forEach(x=>names.push(x.name));
 MONSTER_MASTER.forEach(x=>names.push(x.name));
 ITEM_MASTER.forEach(x=>names.push(x.name));
 ['Hero','Hidden Monster','Item Marker','Red Dragon','Start','Exit','Spike Trap','Healing Pool','Ring','Straight','Corner','T-Junction','Crossroad'].forEach(x=>names.push(x));
 return [...new Set(names)];
}
function openAssetManager(){
 loadAssets();
 const rows=assetNames().map(name=>{
  const key=assetKey(name), src=USER_ASSETS[key]||DEFAULT_ASSETS[name]||DEFAULT_ASSETS[key]||'', fallback=defaultFallback(name);
  return `<div class="assetRow"><div class="assetThumb" id="thumb-${key}">${src?`<img src="${src}" alt="${name}">`:fallback}</div><b>${name}</b><button onclick="pickAsset('${key}','${escapeAttr(name)}')">Upload PNG</button><button class="red" onclick="resetAsset('${key}')">Reset</button><input class="hiddenFile" id="file-${key}" type="file" accept="image/png,image/webp,image/jpeg"></div>`;
 }).join('');
 showModal('Asset Manager v3.0', 'Upload PNGs to replace icons. Best: transparent PNG, 64×64 or 128×128. Saved locally in this browser.', [{text:'Close',fn:closeModal},{text:'Reset All',cls:'red',fn:resetAllAssets}]);
 document.getElementById('modalBody').innerHTML=`<div class="assetTools"><button onclick="exportAssets()">Export JSON</button><button onclick="document.getElementById('importAssetsFile').click()">Import JSON</button><input id="importAssetsFile" class="hiddenFile" type="file" accept="application/json"></div><div class="assetList">${rows}</div>`;
 document.getElementById('importAssetsFile').onchange=importAssets;
}
function escapeAttr(s){return String(s).replace(/'/g,'&#39;')}
function defaultFallback(name){
 const lower=String(name).toLowerCase();
 const ch=CHARACTERS.find(x=>x.name===name); if(ch)return ch.glyph;
 const mo=MONSTER_MASTER.find(x=>x.name===name); if(mo)return mo.glyph;
 const it=ITEM_MASTER.find(x=>x.name===name); if(it)return it.icon;
 const map={'hero':'🧑','hidden monster':'M','start':'🏁','exit':'🚪','spike trap':'▲','healing pool':'💧','item marker':'Item','ring':'◎','straight':'═','corner':'╚','t-junction':'╦','crossroad':'╬'};
 return map[lower]||'?';
}
function pickAsset(key,name){
 const input=document.getElementById('file-'+key); if(!input)return;
 input.onchange=e=>{const file=e.target.files[0]; if(!file)return; const r=new FileReader(); r.onload=()=>{USER_ASSETS[key]=r.result; saveAssets(); const th=document.getElementById('thumb-'+key); if(th)th.innerHTML=`<img src="${r.result}" alt="${name}">`; renderCharSelect(); if(state)render(); if(combat)renderCombat(); toast('Asset saved: '+name);}; r.readAsDataURL(file);};
 input.click();
}
function resetAsset(key){delete USER_ASSETS[key];saveAssets();openAssetManager();if(state)render();}
function resetAllAssets(){if(confirm('Reset all uploaded graphics?')){USER_ASSETS={};saveAssets();openAssetManager();if(state)render();}}
function exportAssets(){const blob=new Blob([JSON.stringify(USER_ASSETS,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='bod-digital-assets-v3.1.json';a.click();URL.revokeObjectURL(a.href)}
function importAssets(e){const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{USER_ASSETS=JSON.parse(r.result);saveAssets();openAssetManager();if(state)render();toast('Assets imported.')}catch(err){alert('Could not import JSON.')}};r.readAsText(file)}
loadAssets();
function expanded(list){const a=[];list.forEach(x=>{for(let i=0;i<x.copies;i++)a.push({...x,id:x.name+'-'+i});});return shuffle(a)}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a}
let state,pan={x:0,y:0,scale:1},placement=null,combat=null,lastPointer=null,devOpen=false,teleportItem=null,rangedMode=null;
window.getBODState=()=>state;
let view3d={enabled:true};
let cameraRotateDrag=null;
let audioCtx=null,soundOn=true;
// Monster landing sound key must be defined before SOUND_DEFS is built.
// Keeping it in this main script prevents the loading/character-select startup
// from failing before the later Three.js renderer script has executed.
function monsterLandSoundKey(name){
 return String(name||'')
  .trim()
  .toLowerCase()
  .replace(/[’']/g,'')
  .replace(/&/g,'and')
  .replace(/[^a-z0-9]+/g,'-')
  .replace(/^-+|-+$/g,'');
}

const SOUND_DEFS=[
 ['move','Footstep / movement'],['tilePlace','Tile placed'],['pickup','Item found / picked up'],['equip','Equip item'],['unequip','Unequip item'],['drop','Drop item'],['dice','Dice roll'],['hit','Combat hit'],['critical','Critical hit'],['sword','Hand weapon attack'],['bow','Bow shot'],['arrowHit','Arrow hit'],['spell','Generic spell'],['fireball','Fireball'],['ice','Ice Staff'],['heal','Healing / potion'],['teleport','Teleport'],['trap','Old Spikey'],['monsterReveal','Monster revealed'],['monsterDie','Monster defeated'],['heroHurt','Hero hurt'],['run','Run away'],['ring','Ring found'],['dragon','Dragon reveal / roar'],['win','Victory'],['lose','Defeat'],['click','UI click'],
 // One landing-thud sound per monster, played when its reveal drop-in
 // animation hits the floor. File names follow the usual kebab convention,
 // e.g. Goblin -> assets/sounds/goblin.mp3, Giant Snake -> giant-snake.mp3.
 ...MONSTER_MASTER.map(m=>[monsterLandSoundKey(m.name),m.name+' lands'])
];
let USER_SOUNDS={},soundVolume=.8;
function loadSounds(){try{USER_SOUNDS=JSON.parse(localStorage.getItem('bodDigitalSoundsV45')||'{}')}catch(e){USER_SOUNDS={}};soundVolume=Number(localStorage.getItem('bodDigitalSoundVolume')||'.8');soundOn=localStorage.getItem('bodDigitalSoundOn')!=='false';}
function saveSounds(){try{localStorage.setItem('bodDigitalSoundsV45',JSON.stringify(USER_SOUNDS));localStorage.setItem('bodDigitalSoundVolume',String(soundVolume));localStorage.setItem('bodDigitalSoundOn',String(soundOn));}catch(e){alert('This sound is too large for browser storage. Use a shorter/compressed MP3 or add it to assets/sounds on GitHub.');}}
function audio(){ if(!audioCtx){audioCtx=new (window.AudioContext||window.webkitAudioContext)();} if(audioCtx.state==='suspended')audioCtx.resume(); return audioCtx;}
function beep(freq=440,dur=.08,type='square',vol=.09,delay=0){ if(!soundOn)return; const c=audio(); const o=c.createOscillator(), g=c.createGain(); o.type=type; o.frequency.setValueAtTime(freq,c.currentTime+delay); g.gain.setValueAtTime(vol*soundVolume,c.currentTime+delay); g.gain.exponentialRampToValueAtTime(.001,c.currentTime+delay+dur); o.connect(g).connect(c.destination); o.start(c.currentTime+delay); o.stop(c.currentTime+delay+dur);}
function fallbackSound(key){const f={move:()=>beep(160,.05,'square',.07),tilePlace:()=>{beep(220,.06,'square',.08);beep(330,.07,'square',.07,.05)},pickup:()=>{beep(740,.08,'triangle',.12);beep(980,.1,'triangle',.1,.07)},equip:()=>{beep(420,.06,'square',.08);beep(650,.08,'triangle',.09,.05)},unequip:()=>beep(300,.08,'triangle',.08),drop:()=>beep(180,.09,'square',.08),dice:()=>{[180,260,210,320].forEach((x,i)=>beep(x,.045,'square',.05,i*.035))},hit:()=>{beep(120,.08,'sawtooth',.11);beep(90,.05,'square',.08,.05)},sword:()=>{beep(210,.045,'sawtooth',.09);beep(125,.08,'triangle',.07,.035)},critical:()=>{[440,660,880].forEach((x,i)=>beep(x,.1,'square',.12,i*.06))},bow:()=>{beep(650,.04,'triangle',.08);beep(220,.1,'sawtooth',.05,.03)},arrowHit:()=>beep(150,.08,'square',.08),spell:()=>{beep(540,.07,'triangle',.11);beep(820,.09,'triangle',.1,.06)},fireball:()=>{beep(180,.18,'sawtooth',.12);beep(90,.22,'sawtooth',.1,.05)},ice:()=>{beep(900,.08,'triangle',.08);beep(1200,.12,'triangle',.06,.06)},heal:()=>{[520,660,780].forEach((x,i)=>beep(x,.1,'sine',.08,i*.07))},teleport:()=>{[300,500,800,1100].forEach((x,i)=>beep(x,.08,'triangle',.07,i*.05))},trap:()=>{beep(110,.18,'square',.12);beep(70,.15,'sawtooth',.1,.08)},monsterReveal:()=>{beep(100,.18,'sawtooth',.12);beep(75,.2,'sawtooth',.1,.08)},monsterDie:()=>{beep(180,.1,'sawtooth',.1);beep(90,.18,'sawtooth',.08,.07)},heroHurt:()=>beep(120,.12,'sawtooth',.1),run:()=>{beep(260,.05,'square',.07);beep(190,.07,'square',.06,.05)},ring:()=>{[660,880,1100].forEach((x,i)=>beep(x,.12,'triangle',.1,i*.08))},dragon:()=>{beep(65,.35,'sawtooth',.14);beep(48,.4,'sawtooth',.11,.1)},win:()=>{[523,659,784,1047].forEach((x,i)=>beep(x,.16,'triangle',.12,i*.1))},lose:()=>{[330,260,210,150].forEach((x,i)=>beep(x,.18,'sawtooth',.1,i*.12))},click:()=>beep(360,.035,'square',.035)}; (f[key]||f.click)();}
// v10.90: Default monster reveal/drop sound. Individual monster sounds can override this later.
window.SOUND_PATHS=window.SOUND_PATHS||{};
window.SOUND_PATHS.monsterReveal='assets/sounds/monster.mp3';

const GITHUB_SOUND_CACHE={};

function soundKeyFilename(key){
 return String(key)
  .replace(/([a-z0-9])([A-Z])/g,'$1-$2')
  .replace(/[^a-z0-9-]+/gi,'-')
  .toLowerCase();
}

function soundCandidates(key){
 const configured=window.SOUND_PATHS&&window.SOUND_PATHS[key];
 const simple=String(key).toLowerCase();
 const kebab=soundKeyFilename(key);
 const paths=[];

 if(configured)paths.push(configured);

 ['mp3','ogg','wav'].forEach(ext=>{
  paths.push(`assets/sounds/${simple}.${ext}`);
  if(kebab!==simple)paths.push(`assets/sounds/${kebab}.${ext}`);
 });

 return [...new Set(paths)];
}

function cacheBustSoundPath(path){
 if(!path||String(path).startsWith('data:'))return path;
 const separator=String(path).includes('?')?'&':'?';
 return `${path}${separator}v=${encodeURIComponent(VERSION)}`;
}

function testSoundPath(path){
 return new Promise(resolve=>{
  const audioTest=new Audio();
  let finished=false;

  const done=ok=>{
   if(finished)return;
   finished=true;
   audioTest.removeAttribute('src');
   audioTest.load();
   resolve(ok);
  };

  const timer=setTimeout(()=>done(false),3500);
  audioTest.preload='metadata';
  audioTest.addEventListener('loadedmetadata',()=>{
   clearTimeout(timer);
   done(true);
  },{once:true});
  audioTest.addEventListener('canplaythrough',()=>{
   clearTimeout(timer);
   done(true);
  },{once:true});
  audioTest.addEventListener('error',()=>{
   clearTimeout(timer);
   done(false);
  },{once:true});

  audioTest.src=cacheBustSoundPath(path);
  audioTest.load();
 });
}

async function resolveGitHubSound(key,force=false){
 if(!force&&Object.prototype.hasOwnProperty.call(GITHUB_SOUND_CACHE,key)){
  return GITHUB_SOUND_CACHE[key];
 }

 const candidates=soundCandidates(key);
 for(const path of candidates){
  if(await testSoundPath(path)){
   GITHUB_SOUND_CACHE[key]=path;
   return path;
  }
 }

 GITHUB_SOUND_CACHE[key]=null;
 return null;
}

async function activeSoundSource(key){
 if(USER_SOUNDS[key]){
  return {type:'browser',src:USER_SOUNDS[key],path:'Stored in this browser'};
 }

 const githubPath=await resolveGitHubSound(key);
 if(githubPath){
  return {type:'github',src:cacheBustSoundPath(githubPath),path:githubPath};
 }

 return {type:'builtin',src:null,path:`Expected: assets/sounds/${String(key).toLowerCase()}.mp3`};
}

async function playSound(key){
 if(!soundOn)return;

 const source=await activeSoundSource(key);
 if(!source.src){
  fallbackSound(key);
  return;
 }

 const player=new Audio(source.src);
 player.volume=soundVolume;

 try{
  await player.play();
 }catch(error){
  if(source.type==='github'){
   delete GITHUB_SOUND_CACHE[key];
   updateSoundManagerRow(key,{
    type:'missing',
    path:source.path
   });
  }
  fallbackSound(key);
 }
}

function sndMove(){playSound('move')}
function sndTile(){playSound('tilePlace')}
function sndItem(){playSound('pickup')}
function sndHit(){playSound('hit')}
function sndSpell(){playSound('spell')}
async function sndMonster(monsterName=''){
 if(monsterName){
  const specificKey=monsterLandSoundKey(monsterName);
  const specificPath=await resolveGitHubSound(specificKey);
  // A specific monster sound exists (e.g. goblin.mp3), so do not also
  // play the generic monster.mp3 reveal. The specific sound fires on impact.
  if(specificPath)return;
 }
 playSound('monsterReveal');
}
function sndWin(){playSound('win')}
function sndLose(){playSound('lose')}

function soundLabel(key){
 const definition=SOUND_DEFS.find(item=>item[0]===key);
 return definition?definition[1]:key;
}

function soundStatusHTML(key,status=null){
 if(USER_SOUNDS[key]){
  return `<div class="soundStatus browser">Browser override<span class="soundPath">Stored only in this browser</span></div>`;
 }

 if(status?.type==='github'){
  return `<div class="soundStatus github">✓ GitHub sound loaded<span class="soundPath">${status.path}</span></div>`;
 }

 if(status?.type==='missing'){
  return `<div class="soundStatus missing">GitHub sound missing or unreadable<span class="soundPath">${status.path}</span></div>`;
 }

 return `<div class="soundStatus" id="sound-status-${key}">Checking GitHub…<span class="soundPath">assets/sounds/${String(key).toLowerCase()}.mp3</span></div>`;
}

function updateSoundManagerRow(key,status){
 const row=document.getElementById(`sound-status-wrap-${key}`);
 if(!row)return;
 row.innerHTML=soundStatusHTML(key,status);
}

async function refreshSoundManagerStatuses(){
 await Promise.all(SOUND_DEFS.map(async([key])=>{
  if(USER_SOUNDS[key]){
   updateSoundManagerRow(key,{type:'browser'});
   return;
  }

  const path=await resolveGitHubSound(key,true);
  updateSoundManagerRow(
   key,
   path
    ?{type:'github',path}
    :{type:'missing',path:`assets/sounds/${String(key).toLowerCase()}.mp3`}
  );
 }));
}

function openSoundManager(){
 const rows=SOUND_DEFS.map(([key,label])=>`
  <div class="soundRow">
   <div>
    <b>${label}</b>
    <div id="sound-status-wrap-${key}">
     ${soundStatusHTML(key)}
    </div>
   </div>
   <button type="button" onclick="playSound('${key}')">▶</button>
   <button type="button" onclick="chooseSound('${key}')">Upload</button>
   <button type="button" onclick="resetSound('${key}')" ${USER_SOUNDS[key]?'':'disabled'}>Reset</button>
  </div>
 `).join('');

 showModal(
  'Sound Manager',
  'The active source is checked in this order: browser override, GitHub sound, then built-in test sound.',
  [
   {text:'Close',fn:closeModal},
   {
    text:soundOn?'Mute':'Unmute',
    fn:()=>{
     soundOn=!soundOn;
     saveSounds();
     openSoundManager();
    }
   },
   {text:'Reset All',cls:'red',fn:resetAllSounds}
  ]
 );

 document.getElementById('modalBody').innerHTML=`
  <div class="volumeRow">
   <b>Volume</b>
   <input id="soundVolume" type="range" min="0" max="1" step="0.05" value="${soundVolume}">
   <span id="soundVolumeValue">${Math.round(soundVolume*100)}%</span>
  </div>
  <div class="small">
   Green means the sound was found on GitHub and can be heard by everyone.
   Brown means a private browser override is active.
   Red means the expected GitHub file could not be loaded.
  </div>
  <div class="soundList">${rows}</div>
  <input id="soundUpload" class="hiddenFile" type="file" accept="audio/mpeg,audio/ogg,audio/wav,.mp3,.ogg,.wav">
 `;

 const volumeControl=document.getElementById('soundVolume');
 volumeControl.oninput=()=>{
  soundVolume=Number(volumeControl.value);
  document.getElementById('soundVolumeValue').textContent=Math.round(soundVolume*100)+'%';
  saveSounds();
 };

 refreshSoundManagerStatuses();
}
let pendingSoundKey=null;
function chooseSound(key){
 pendingSoundKey=key;
 const input=document.getElementById('soundUpload');
 input.value='';

 input.onchange=event=>{
  const file=event.target.files[0];
  if(!file)return;

  if(
   file.size>1500000 &&
   !confirm('This file is fairly large and may exceed browser storage. Continue?')
  )return;

  const reader=new FileReader();
  reader.onload=()=>{
   USER_SOUNDS[pendingSoundKey]=reader.result;
   saveSounds();
   playSound(pendingSoundKey);
   openSoundManager();
  };
  reader.readAsDataURL(file);
 };

 input.click();
}

function resetSound(key){
 delete USER_SOUNDS[key];
 delete GITHUB_SOUND_CACHE[key];
 saveSounds();
 openSoundManager();
}

function resetAllSounds(){
 if(!confirm('Reset all browser-uploaded sounds?'))return;
 USER_SOUNDS={};
 Object.keys(GITHUB_SOUND_CACHE).forEach(key=>delete GITHUB_SOUND_CACHE[key]);
 saveSounds();
 openSoundManager();
}
loadSounds();
window.addEventListener('pointerdown',()=>{try{audio()}catch(e){}},{once:true});
function createTileDeck(){
  // Start is face up and Exit is set aside. These 38 ordinary floor tiles form the shuffled dungeon stack.
  const deck=[...Array(15)].map(()=>({kind:'straight'}))
    .concat([...Array(14)].map(()=>({kind:'corner'})),[...Array(2)].map(()=>({kind:'t'})),[...Array(5)].map(()=>({kind:'cross'})),[{kind:'spike'},{kind:'pool'}]);

  const ordinaryFloors=()=>deck.filter(t=>!['spike','pool'].includes(t.kind));

  // Guarantee exactly eleven distinct monster locations: M2 through M12.
  // The monsters themselves remain random draws when their markers are revealed.
  shuffle(ordinaryFloors()).slice(0,11).forEach((tile,index)=>{
    tile.monsterMarker=true;
    tile.mNumber=index+2;
  });

  // Defensive validation in case the deck composition is edited later.
  let mTiles=deck.filter(t=>t.monsterMarker).sort((a,b)=>a.mNumber-b.mNumber);
  const validM=mTiles.length===11&&mTiles.every((tile,index)=>tile.mNumber===index+2);
  if(!validM){
    deck.forEach(tile=>{delete tile.monsterMarker;delete tile.mNumber;});
    shuffle(ordinaryFloors()).slice(0,11).forEach((tile,index)=>{
      tile.monsterMarker=true;
      tile.mNumber=index+2;
    });
  }

  // Exactly two item locations are placed in every game.
  // They are transparent item.png overlays on otherwise normal random floor tiles,
  // never separate item tiles and never overlapping M2-M12, traps or the healing pool.
  deck.forEach(tile=>delete tile.itemMarker);
  const itemLocations=shuffle(ordinaryFloors().filter(tile=>!tile.monsterMarker)).slice(0,2);
  itemLocations.forEach(tile=>{tile.itemMarker=true;});

  if(deck.filter(tile=>tile.itemMarker).length!==2){
    throw new Error('Dungeon setup failed: exactly two item markers are required.');
  }

  return shuffle(deck);
}
function showTesterWarning(){
 showModal('A WARNING FROM THE DUNGEON','',[{text:'Enter at your own risk',cls:'green',fn:closeModal}]);
 const body=document.getElementById('modalBody');
 if(body)body.innerHTML=`<div class="testerWarningScroll"><div style="font-size:28px;font-weight:700;margin-bottom:28px;">A WARNING FROM THE DUNGEON</div>You have <b>ONE LIFE</b>. If your hero falls, the dungeon claims you and the game ends.<br><br>Your quest: Get in, get the Ring, and try to get out alive.<br><br><span style="color:#B4201A;font-weight:bold;">BEWARE! The Red Dragon waits patiently for you at the Exit.</span><br><br>Good luck, brave adventurer. You’ll need it.</div>`;
}
function newGame(charDef=CHARACTERS[0]){document.getElementById('log').innerHTML='';pan={x:0,y:0,scale:1};view3d={enabled:true};if(window.BOD3D)window.BOD3D.resetHeroFacing();state={charDef,tiles:{},tileDeck:createTileDeck(),monsterDeck:expanded(MONSTER_MASTER),itemDeck:expanded(ITEM_MASTER),tileDiscard:[],monsterDiscard:[],itemDiscard:[],exitPlaced:false,ringActivated:false,ringKey:null,ringNumber:null,ringRoll:null,turns:1,startedAt:Date.now(),player:{x:0,y:0,prevX:0,prevY:0,facing:'S',maxHealth:charDef.maxHealth,health:charDef.maxHealth,maxAp:charDef.maxAp,ap:charDef.maxAp,baseDice:charDef.baseDice,baseMod:charDef.baseMod,lives:1,hasRing:false,equipment:{},slots:{left:null,right:null,armour:null,boots:null,cloak:null},backpack:[],companionBear:null,inventory:[],flags:{special:charDef.special,usedSpecial:false,renewCharges:3,bootsBonus:false,torchFreeLay:false},temp:{},killed:[]},gameOver:false};state.tiles['0,0']={kind:'start',opens:{...TILE_BASE.start},rot:0,visited:true};log(charDef.name+' enters the dungeon.','system');log('Welcome to Bag of Dungeon 3D '+VERSION+'.','system');render();setTimeout(()=>{setOpeningCamera();showTesterWarning();},0);}

const TESTER_SINGLE_LIFE=true;
const INVENTORY_LIMIT=8;
const BACKPACK_LIMIT=4;
const TWO_HANDED_NAMES=new Set(['Bow','Elven Bow','Large Steel Axe']);
const ARMOUR_NAMES=new Set(['Rusty Armour','Steel Armour','Magic Armour']);
const BOOTS_NAMES=new Set(['Magic Boots']);
const CLOAK_NAMES=new Set(['Invisibility Cloak']);
let pendingItemQueue=[];
function isBear(item){return item&&item.name==='Loyal Bear';}
function isChest(item){return !!item&&['Small Chest','Large Chest'].includes(item.name);}
function isTwoHanded(item){return !!item&&TWO_HANDED_NAMES.has(item.name);}
function isArmour(item){return !!item&&ARMOUR_NAMES.has(item.name);}
function isBoots(item){return !!item&&BOOTS_NAMES.has(item.name);}
function isCloak(item){return !!item&&CLOAK_NAMES.has(item.name);}
function isAttire(item){return isArmour(item)||isBoots(item)||isCloak(item);}
function isHandItem(item){return !!item&&!isAttire(item)&&!isBear(item);}
function occupiedSpaceCount(){const p=state.player;let n=p.backpack.length;n+=p.slots.armour?1:0;n+=p.slots.boots?1:0;n+=p.slots.cloak?1:0;n+=p.slots.left?1:0;n+=p.slots.right?1:0;return n;}
function carriedCount(){return occupiedSpaceCount();}
function allCarriedItems(){const p=state.player;const out=[...p.backpack];['left','right','armour','boots','cloak'].forEach(s=>{const it=p.slots[s];if(it&&!out.includes(it))out.push(it)});if(p.companionBear)out.push(p.companionBear);return out;}
function syncEquipment(){const p=state.player,s=p.slots,e={};const hands=[s.left,s.right].filter(Boolean);const weapon=hands.find(x=>['Steel Sword','Magic Sword','Small Axe','Iron Axe','Large Steel Axe','Morning Star'].includes(x.name));const shield=hands.find(x=>['Steel Shield','Magic Shield'].includes(x.name));const bow=hands.find(x=>['Bow','Elven Bow'].includes(x.name));const staff=hands.find(x=>x.name==='Ice Staff');const dragonlance=hands.find(x=>x.name==='Dragonlance');const cloak=s.cloak;const torch=hands.find(x=>x.name==='Torch');if(weapon)e.weapon=weapon;if(shield)e.shield=shield;if(bow)e.bow={...bow,dice:1,bonus:bow.name==='Elven Bow'?2:0};if(staff)e.staff=staff;if(dragonlance)e.dragonlance=dragonlance;if(cloak)e.cloak=cloak;if(torch)e.torch=torch;else if(p.flags)p.flags.torchFreeLay=false;if(s.armour)e.armour=s.armour;if(s.boots)e.boots=s.boots;if(p.companionBear)e.bear=p.companionBear;p.equipment=e;}
function removeFromCurrentLocation(item){const p=state.player;const bi=p.backpack.indexOf(item);if(bi>=0)p.backpack.splice(bi,1);['left','right','armour','boots','cloak'].forEach(s=>{if(p.slots[s]===item)p.slots[s]=null});syncEquipment();}
function moveToBackpack(item){const p=state.player;if(p.backpack.includes(item))return true;if(p.backpack.length>=BACKPACK_LIMIT){toast('Backpack is full');return false;}removeFromCurrentLocation(item);p.backpack.push(item);syncEquipment();playSound('unequip');return true;}
function equipToSlot(item,slot){const p=state.player;if(slot==='armour'&&!isArmour(item))return false;if(slot==='boots'&&!isBoots(item))return false;if(slot==='cloak'&&!isCloak(item))return false;if((slot==='left'||slot==='right')&&!isHandItem(item))return false;
 if(isTwoHanded(item)){const displaced=[p.slots.left,p.slots.right].filter(Boolean).filter(x=>x!==item);if(p.backpack.length+displaced.length>BACKPACK_LIMIT){toast('Not enough backpack room to free both hands');return false;}displaced.forEach(x=>{removeFromCurrentLocation(x);p.backpack.push(x)});removeFromCurrentLocation(item);p.slots.left=item;p.slots.right=item;}
 else {const old=p.slots[slot];if(old&&old!==item){if(p.backpack.length>=BACKPACK_LIMIT){toast('Backpack is full');return false;}removeFromCurrentLocation(old);p.backpack.push(old);}if((slot==='left'||slot==='right')){const other=slot==='left'?'right':'left';if(p.slots[other]===item)p.slots[other]=null;}removeFromCurrentLocation(item);p.slots[slot]=item;}
 if(slot==='boots'&&item.name==='Magic Boots'&&!p.flags.bootsBonus){p.flags.bootsBonus=true;p.maxAp+=1;p.ap+=1;}syncEquipment();playSound('equip');toast(item.name+' equipped');return true;}
function unequipItem(item){const p=state.player;if(!item)return false;if(p.backpack.length>=BACKPACK_LIMIT){toast('Backpack is full');return false;}if(item.name==='Magic Boots'&&p.flags.bootsBonus){p.flags.bootsBonus=false;p.maxAp=Math.max(1,p.maxAp-1);p.ap=Math.min(p.ap,p.maxAp);}removeFromCurrentLocation(item);p.backpack.push(item);syncEquipment();return true;}
function equippedSlotFor(item){const s=state.player.slots;if(s.left===item&&s.right===item)return 'both hands';if(s.left===item)return 'left hand';if(s.right===item)return 'right hand';if(s.armour===item)return 'armour';if(s.boots===item)return 'boots';if(s.cloak===item)return 'attire';if(state.player.companionBear===item)return 'companion';return null;}
function carriedHas(item){return allCarriedItems().includes(item);}
function addToInventory(item,tile=getTile(state.player.x,state.player.y)){if(!item)return false;if(isBear(item)){state.player.companionBear=item;syncEquipment();sndItem();log('Loyal Bear joins you and uses no inventory space.','loot');render();return true;}pendingItemQueue.push({item,tile});if(pendingItemQueue.length===1)processPendingItem();return true;}
function processPendingItem(){if(!pendingItemQueue.length)return;const {item,tile}=pendingItemQueue[0];const p=state.player;const buttons=[];if(isArmour(item)&&!p.slots.armour)buttons.push({text:'Wear Armour',cls:'green',fn:()=>finishPlaceNew(item,()=>equipToSlot(item,'armour'))});if(isBoots(item)&&!p.slots.boots)buttons.push({text:'Wear Boots',cls:'green',fn:()=>finishPlaceNew(item,()=>equipToSlot(item,'boots'))});if(isCloak(item)&&!p.slots.cloak)buttons.push({text:'Wear Attire',cls:'green',fn:()=>finishPlaceNew(item,()=>equipToSlot(item,'cloak'))});if(isHandItem(item)){if(!p.slots.left)buttons.push({text:isTwoHanded(item)?'Equip Both Hands':'Equip Left Hand',cls:'green',fn:()=>finishPlaceNew(item,()=>equipToSlot(item,'left'))});if(!isTwoHanded(item)&&!p.slots.right)buttons.push({text:'Equip Right Hand',cls:'green',fn:()=>finishPlaceNew(item,()=>equipToSlot(item,'right'))});}
 if(p.backpack.length<BACKPACK_LIMIT)buttons.push({text:'Put in Backpack',fn:()=>finishPlaceNew(item,()=>{p.backpack.push(item);syncEquipment();return true;})});buttons.push({text:'Leave on Tile',cls:'red',fn:()=>finishPlaceNew(item,()=>{tile.droppedItems=tile.droppedItems||[];tile.droppedItems.push(item);return true;})});showModal('You found '+item.name,(item.desc||'Choose where to place this item.')+'\n\nInventory spaces used: '+occupiedSpaceCount()+'/8',buttons);}
function finishPlaceNew(item,fn){const ok=fn();if(ok===false)return;closeModal();sndItem();log('Placed '+item.name+'.','loot');pendingItemQueue.shift();render();setTimeout(processPendingItem,30);}
function dropItemObject(item){const p=state.player;if(item.name==='Magic Boots'&&p.flags.bootsBonus){p.flags.bootsBonus=false;p.maxAp=Math.max(1,p.maxAp-1);p.ap=Math.min(p.ap,p.maxAp);}if(p.companionBear===item)p.companionBear=null;removeFromCurrentLocation(item);const t=getTile(p.x,p.y);t.droppedItems=t.droppedItems||[];t.droppedItems.push(item);syncEquipment();playSound('drop');log('Dropped '+item.name+' on this tile.','system');closeModal();render();}
function dropItem(idx){const item=allCarriedItems()[idx];if(item)dropItemObject(item);}
function pickupDropped(idx){const tileKey=key(state.player.x,state.player.y);beginDroppedPickup(tileKey,idx);}
function key(x,y){return `${x},${y}`;}
function getTile(x,y){return state.tiles[key(x,y)]}
function openings(kind,rot=0){let base={...TILE_BASE[kind]},cur=base;for(let i=0;i<rot;i++){cur={N:cur.W,E:cur.N,S:cur.E,W:cur.S};}return cur}
function roll(n){let t=0,r=[];for(let i=0;i<n;i++){const v=1+Math.floor(Math.random()*6);r.push(v);t+=v;}return {total:t,rolls:r}}
function applyEquipmentStats(item){
 if(!item)return 0;
 if(typeof item.value==='number')return item.value;
 const values={
  'Rusty Armour':1,'Steel Armour':1,'Magic Armour':2,
  'Steel Shield':1,'Magic Shield':2,
  'Steel Sword':1,'Magic Sword':2,'Small Axe':1,'Iron Axe':2,
  'Large Steel Axe':3,'Morning Star':2
 };
 return values[item.name]||0;
}
function drawMonster(){let m=state.monsterDeck.pop();if(!m)return null;if(m.name==='Mirror Monster'){m.maxHealth=state.player.health;m.health=state.player.health;m.dice=pDice();m.mod=pCombatMod();} else m.health=m.maxHealth; m.revealed=false; return m;}
function drawItem(){const it=state.itemDeck.pop();if(!it)return null;return {...it};}
function awardItem(item=drawItem()){
 if(!item)return log('No items left in the item deck.','system');
 const tile=getTile(state.player.x,state.player.y);
 log('Found '+item.name+'.','loot');
 if(isChest(item)){
  tile.droppedItems=tile.droppedItems||[];
  tile.droppedItems.push(item);
  sndItem();
  render();
  setTimeout(()=>offerChestOnTile(key(state.player.x,state.player.y),item),40);
  return true;
 }
 return addToInventory(item,tile);
}
function maybePopulate(tile){ if(tile.monsterMarker) tile.monsterPending=true; if(tile.itemMarker) tile.itemPending=true; }
function startPlace(dir){const p=state.player;const freeTorchLay=!!(p.equipment.torch&&p.flags.torchFreeLay);if(p.ap<1&&!freeTorchLay)return;const raw=state.tileDeck.pop();if(!raw){log('No dungeon tiles left.','system');return;}placement={dir,kind:raw.kind,rot:0,raw};showPlacement();}
function showPlacement(){const need=DIRS[placement.dir].opp;document.getElementById('placeInfo').textContent='Drawn: '+TILE_LABEL[placement.kind]+' — placing to the '+placement.dir+'.';document.getElementById('tilePreview').innerHTML=tileSVG({kind:placement.kind,rot:placement.rot,opens:openings(placement.kind,placement.rot)});document.getElementById('placeBtn').disabled=!openings(placement.kind,placement.rot)[need];document.getElementById('placement').classList.add('open');}
document.getElementById('rotBtn').onclick=()=>{placement.rot=(placement.rot+1)%4;showPlacement();};
document.getElementById('cancelPlace').onclick=()=>{if(placement){state.tileDeck.push(placement.raw);shuffle(state.tileDeck);}placement=null;document.getElementById('placement').classList.remove('open');render();setTimeout(()=>centreOnHero(),0);};
document.getElementById('placeBtn').onclick=()=>{const p=state.player,d=DIRS[placement.dir],nx=p.x+d.dx,ny=p.y+d.dy;const tile={kind:placement.kind,rot:placement.rot,opens:openings(placement.kind,placement.rot),visited:false,monsterMarker:placement.raw.monsterMarker,mNumber:placement.raw.mNumber||null,itemMarker:placement.raw.itemMarker};maybePopulate(tile);state.tiles[key(nx,ny)]=tile;
 const usedFreeTorchLay=!!(p.equipment.torch&&p.flags.torchFreeLay);
 if(usedFreeTorchLay){p.flags.torchFreeLay=false;log('Torch: second dungeon tile placed for no extra AP.','system');}
 else {p.ap-=1;if(p.equipment.torch&&state.tileDeck.length>0){p.flags.torchFreeLay=true;log('Torch: your next tile placement costs 0 AP.','system');}}
 sndTile();log('Placed '+TILE_LABEL[tile.kind]+(tile.itemMarker?' with item marker':'')+' to the '+placement.dir+'.','system');if(state.tileDeck.length===0&&!state.exitPlaced)placeExitAndRing(nx,ny,tile);placement=null;document.getElementById('placement').classList.remove('open');render();setTimeout(()=>centreOnHero(),0);};
function placeExitAndRing(x,y,fromTile){
 state.exitPlaced=true;
 let exitKey=null, placed=false;
 for(const dir of dirOrder){
  const d=DIRS[dir],ex=x+d.dx,ey=y+d.dy;
  if(fromTile.opens[dir]&&!getTile(ex,ey)){
   exitKey=key(ex,ey);
   state.tiles[exitKey]={kind:'exit',opens:{...TILE_BASE.exit},rot:0,visited:false,monster:{name:'Red Dragon',dice:4,mod:0,maxHealth:20,health:20,glyph:'🐉',revealed:true,isDragon:true}};
   placed=true;break;
  }
 }
 if(!placed){
  for(const dir of dirOrder){
   const d=DIRS[dir],ex=x+d.dx,ey=y+d.dy;
   if(!getTile(ex,ey)){
    exitKey=key(ex,ey);
    state.tiles[exitKey]={kind:'exit',opens:{...TILE_BASE.exit},rot:0,visited:false,monster:{name:'Red Dragon',dice:4,mod:0,maxHealth:20,health:20,glyph:'🐉',revealed:true,isDragon:true}};
    break;
   }
  }
 }
 // Board-game Ring system: when the Exit appears, roll 2 dice and place the Ring on the matching M2-M12 floor tile.
 const rr=roll(2);
 const ringNumber=rr.total;
 const found=Object.entries(state.tiles).find(([kk,t])=>t.mNumber===ringNumber);
 state.ringActivated=true;
 state.ringNumber=ringNumber;
 state.ringRoll=[...rr.rolls];
 state.ringKey=found?found[0]:null;
 if(found){found[1].hasRing=true;found[1].ringReveal=true;setTimeout(()=>{if(found[1]){found[1].ringReveal=false;render();}},3000);}
 playSound('dragon');playTileEffect(exitKey,'dragon',1400);
 playSound('dice');
 window.BODDice3D?.roll?.(rr.rolls);
 log('The final dungeon tile is laid. The Exit appears and the Red Dragon guards it.','loot');
 log('Ring location roll: '+rr.rolls.join(' + ')+' = '+ringNumber+'. The Ring of Creation appears at M'+ringNumber+' and must be physically collected.','loot');
 if(found){
  const ringTile=found[1];
  if(ringTile.monsterPending || (ringTile.monster&&ringTile.monster.health>0)){
   log('A monster guards the Ring. It must be defeated before the Ring can be collected.','combat');
  }
  // The Ring remains at its location until the hero physically reaches
  // the tile and any guarding monster has been defeated.
 }else{
  log('Error: the rolled Ring location could not be found in the laid dungeon.','combat');
 }
}
function collectRingIfSafe(tileKey){
 if(!state.ringActivated||state.player.hasRing||state.ringKey!==tileKey)return false;
 if(key(state.player.x,state.player.y)!==tileKey)return false;
 const t=state.tiles[tileKey];
 if(!t||!t.hasRing)return false;
 const livingMonster=t.monsterPending||(t.monster&&t.monster.health>0);
 if(livingMonster)return false;
 t.hasRing=false;
 state.player.hasRing=true;
 playSound('ring');playTileEffect(tileKey,'ring',1200);
 log('You pick up the Ring of Creation!','loot');
 toast('You found the Ring of Creation!');
 return true;
}
function canMove(dir){const p=state.player,t=getTile(p.x,p.y),d=DIRS[dir],nt=getTile(p.x+d.dx,p.y+d.dy);return t&&t.opens[dir]&&nt&&nt.opens[d.opp];}
function canLay(dir){const p=state.player,t=getTile(p.x,p.y),d=DIRS[dir];return t&&t.opens[dir]&&!getTile(p.x+d.dx,p.y+d.dy)&&state.tileDeck.length>0;}

function move(dir){window.BOD3D?.clearDice3D?.();const p=state.player;if(p.ap<1)return;const d=DIRS[dir];p.facing=dir;p.prevX=p.x;p.prevY=p.y;p.x+=d.dx;p.y+=d.dy;p.ap-=1;sndMove();const t=getTile(p.x,p.y);t.visited=true;
 if(t.kind==='spike'){promptOldSpikey(t);render();centreOnHero(false);return;}
 if(t.kind==='pool'&&!t.poolUsed){promptHealingPool(t);}
 if(t.itemPending&&!t.itemUsed){t.itemUsed=true;t.itemPending=false;awardItem(drawItem());}
 if(t.droppedItems&&t.droppedItems.length){setTimeout(()=>offerDroppedItems(),80);}
 if(t.monsterPending&&!t.monster){t.monster=drawMonster();t.monsterPending=false;sndMonster(t.monster.name);log('A monster is revealed: '+t.monster.name+'.','combat');}
 if(t.monster&&t.monster.health>0){
  // Entering the tile identifies the monster even when the Cloak lets you pass.
  t.monster.revealed=true;
  t.monster.discoveredByCloak=!!p.equipment.cloak;

  if(p.equipment.cloak&&t.kind!=='exit'&&!t.monster.isDragon){
   showCloakChoice(t);
   render();
   return;
  }
  openCombat(t);
 }
 else {collectRingIfSafe(key(p.x,p.y));}
 if(t.kind==='exit'&&p.hasRing&&!t.monster){win();}
 render();centreOnHero(false);}
function showCloakChoice(tile){
 const m=tile.monster;
 m.revealed=true;

 showModal(
  'Invisibility Cloak',
  m.name+'\nHealth '+m.health+'/'+m.maxHealth+
  '\nCombat '+m.dice+'d6+'+m.mod+
  '\n\nThe monster is now revealed on the dungeon. Roll to sneak past it. On a 1–2 the '+
  m.name+' spots you and you must fight with no chance to flee. The Dragon would still see you regardless.',
  [
   {
    text:'Sneak Past',
    cls:'green',
    fn:()=>{
     closeModal();
     m.revealed=true;
     const roll1=roll(1).total;

     if(roll1<=2){
      log('You roll '+roll1+' — the '+m.name+' spots you! There is no escape.','combat');
      openCombat(tile,{noEscape:true});
     }else{
      log('You roll '+roll1+' and slip past the revealed '+m.name+'.','system');
      render();
     }
    }
   },
   {
    text:'Fight',
    cls:'red',
    fn:()=>{
     closeModal();
     m.revealed=true;
     openCombat(tile);
    }
   }
  ]
 );
}
function promptOldSpikey(tile){
 const carried=allCarriedItems().filter(x=>!isBear(x));
 const buttons=[];
 if(carried.length)buttons.push({text:'Destroy an Item',cls:'red',fn:()=>chooseSpikeSacrifice(tile)});
 buttons.push({text:'Roll the Dice',cls:'green',fn:async()=>{closeModal();const triggerRoll=roll(1);const trigger=triggerRoll.total;playSound('dice');const triggerDice=window.BODDice3D?.roll?.(triggerRoll.rolls,'hero');if(triggerDice&&typeof triggerDice.then==='function')await triggerDice;if(trigger<=2){const dmgRoll=roll(1);const dmg=dmgRoll.total;const damageDice=window.BODDice3D?.roll?.(dmgRoll.rolls,'hero');if(damageDice&&typeof damageDice.then==='function')await damageDice;state.player.health-=dmg;playSound('trap');playSound('hit');playSound('heroHurt');showCombatImpact('hero',state.player.health<=0?'kill':'hit',dmg);playCurrentTileEffect('trap',900);log('Old Spikey rolls '+trigger+' and springs! You take '+dmg+' direct damage.','combat');if(state.player.health<=0){death();return;}}else log('Old Spikey rolls '+trigger+'. You cross safely.','system');render();}});
 showModal('Old Spikey','Destroy one carried item to jam the mechanism, or roll a die. On 1–2 the trap springs and deals one die of direct damage.',buttons);
}
function chooseSpikeSacrifice(tile){const items=allCarriedItems().filter(x=>!isBear(x));showModal('Jam Old Spikey','Choose an item to destroy.',items.map(it=>({text:it.name,cls:'red',fn:()=>{dropDestroyedItem(it);closeModal();log('Destroyed '+it.name+' to jam Old Spikey.','system');render();}})).concat([{text:'Back',fn:()=>promptOldSpikey(tile)}]));}
function dropDestroyedItem(item){const p=state.player;if(item.name==='Magic Boots'&&p.flags.bootsBonus){p.flags.bootsBonus=false;p.maxAp=Math.max(1,p.maxAp-1);p.ap=Math.min(p.ap,p.maxAp);}removeFromCurrentLocation(item);state.itemDiscard.push(item);syncEquipment();}
function promptHealingPool(tile){
 showModal('Healing Pool','Use the Healing Pool and restore your Health to full? The pool can only be used once.'+(tile.droppedItems&&tile.droppedItems.length?'\n\nItems belonging to a fallen adventurer lie here and may be recovered.':''),[
  {text:'Yes — Heal',cls:'green',fn:()=>{closeModal();state.player.health=state.player.maxHealth;tile.poolUsed=true;sndItem();playCurrentTileEffect('heal',1000);log('You use the Healing Pool and restore your health to full.','heal');render();}},
  {text:'No — Leave It',fn:()=>{closeModal();log('You leave the Healing Pool unused.','system');render();}}
 ]);
}
function clearPlayerItems(){const p=state.player;p.slots={left:null,right:null,armour:null,boots:null,cloak:null};p.backpack=[];p.companionBear=null;p.flags.bootsBonus=false;p.maxAp=state.charDef.maxAp;p.ap=Math.min(p.ap,p.maxAp);syncEquipment();}
function healingPoolTile(){return Object.values(state.tiles).find(t=>t.kind==='pool')||null;}
function useInventoryItem(list,idx){ /* legacy alias */ if(list==='inventory')useInventoryIndex(idx); }
function useItem(it,consume){const p=state.player,m=combat?.tile?.monster;let used=false,msg='';
 if(it.use==='healthPotion'){const h=roll(2).total;p.health=Math.min(p.maxHealth,p.health+h);msg='Health Potion restores '+h+' health.';used=true;}
 if(it.use==='strengthPotion'){p.temp.strength=true;msg='Strength Potion: +1 combat die for this fight.';used=true;}
 if(it.use==='reroll'){p.flags.reroll=true;msg="Imp's Teeth ready: your next combat roll rerolls.";used=true;}
 if(it.use==='iceStaff'){startRangedAttack('iceStaff');return;}
 if(it.use==='fireball'){
  startRangedAttack('fireball',it,consume);
  return;
 }
 if(it.use==='daggers'){
  startRangedAttack('daggers',it,consume);
  return;
 }
 if(['bomb','skull','vine','vampire','claw'].includes(it.use)&&m){let dmg=0,cost=0;if(it.use==='bomb'){dmg=roll(2).total;cost=1;}if(it.use==='skull'){dmg=roll(1).total;}if(it.use==='vine'){dmg=roll(1).total;cost=1;combat.monsterSkip=true;window.BOD3D?.playEffect?.('vine');}if(it.use==='vampire'){dmg=5;p.health=Math.min(p.maxHealth,p.health+5);}if(it.use==='claw'){m.mod=Math.max(0,m.mod-2);dmg=0;}if(p.ap<cost){toast('Not enough AP');return;}p.ap-=cost;m.health-=dmg;msg=it.name+' used. '+(dmg?m.name+' takes '+dmg+' damage.':'Monster weakened.');used=true;}
 if(it.use==='tornado'&&combat){
 if(combat.noEscape){toast('There is no escape from this fight!');return;}
 msg='Tornado carries you safely away.';window.BOD3D?.playEffect?.('tornado');
 used=true;
 consume?.();
 const oldCombat=combat;
 const oldX=p.x,oldY=p.y;
 p.x=p.prevX;
 p.y=p.prevY;
 const dx=p.x-oldX,dy=p.y-oldY;
 if(Math.abs(dx)>=Math.abs(dy)&&dx!==0)p.facing=dx>0?'E':'W';
 else if(dy!==0)p.facing=dy>0?'S':'N';
 window.BOD3D?.snapHeroToPlayer?.();
 if(oldCombat?.tile?.monster)oldCombat.tile.monster.revealed=true;
 document.getElementById('combatLog').textContent=msg;
 log(msg,'loot');
 closeCombat();
 render();
 centreOnHero(false);
 return;
}
 if(it.use==='smallChest'){const r=roll(1).total;if(r<=2){p.health-=2;msg='Chest trap! Take 2 damage.';}else{awardItem();msg='Small Chest opened: draw 1 item.';}used=true;}
 if(it.use==='largeChest'){const r=roll(1).total;if(r<=2){p.health-=5;msg='TRAPPED! Take 5 damage.';}else{awardItem();awardItem();msg='Large Chest opened: draw 2 items.';}used=true;}
 if(it.use==='teleport'){showTeleport(it);used=false;}
 if(msg){if(it.use==='fireball'){playSound('spell');playCurrentTileEffect('fireball',1000);}else if(it.use==='bomb'){playCurrentTileEffect('explosion',950);sndSpell();}else if(it.name==='Ice Staff'){playSound('spell');playCurrentTileEffect('ice',900);}else if(it.use==='healthPotion'){playSound('heal');playCurrentTileEffect('heal',1000);}else if(it.use==='teleport')playSound('teleport');else sndSpell();log(msg,it.use==='healthPotion'?'heal':'loot');toast(msg);} if(used&&consume)consume(); if(m&&m.health<=0){killMonster();return;} if(p.health<=0){death();return;}render();if(combat)renderCombat();}
function showTeleport(item){
 if(!item||!carriedHas(item)){toast('Teleport Crystal is not being carried');return;}
 teleportItem=item;
 closeModal();
 log('Teleport Crystal ready: choose any laid dungeon tile.','system');
 toast('Choose a dungeon tile');
 render();
}
function cancelTeleport(){teleportItem=null;toast('Teleport cancelled');render();}
function teleportToTile(tileKey,event){
 if(event){event.preventDefault();event.stopPropagation();}
 if(!teleportItem)return;
 const t=state.tiles[tileKey];if(!t)return;
 const [x,y]=tileKey.split(',').map(Number);
 const crystal=teleportItem;teleportItem=null;
 {
 const oldX=state.player.x,oldY=state.player.y;
 const dx=x-oldX,dy=y-oldY;
 if(Math.abs(dx)>=Math.abs(dy)&&dx!==0)state.player.facing=dx>0?'E':'W';
 else if(dy!==0)state.player.facing=dy>0?'S':'N';
 state.player.x=x;state.player.y=y;state.player.prevX=x;state.player.prevY=y;
}
 removeFromCurrentLocation(crystal);state.itemDiscard.push(crystal);syncEquipment();
 playSound('teleport');playTileEffect(tileKey,'teleport',1000);log('Teleported to '+tileKey+'.','system');render();centreOnHero(false);
}
function removeNamed(arr,name){const i=arr.findIndex(x=>x.name===name);if(i>=0)arr.splice(i,1);}
function endTurn(automatic=false){
 const p=state.player;
 if(p.flags)p.flags.autoRestScheduled=false;
 state.turns=(state.turns||1)+1;
 p.ap=p.maxAp;
 p.flags.torchFreeLay=false;
 Object.values(state.tiles).forEach(t=>{
  if(t.monster&&t.monster.health>0)t.monster.health=t.monster.maxHealth;
 });
 if(automatic)toast('YOU REST');
 log('You rest. AP restored. Surviving monsters heal to full.','system');
 render();
}
function heartLine(h,m){const n=Math.max(0,Math.ceil((h/m)*10));return '♥'.repeat(n)+'♡'.repeat(10-n)}
function addBtn(w,text,cls,fn,disabled=false){const b=document.createElement('button');b.textContent=text;if(cls)b.className=cls;b.disabled=disabled;b.onclick=fn;w.appendChild(b);return b;}

function openAbout(){
  showModal('About Bag of Dungeon 3D','',[
    {text:'Close',fn:closeModal}
  ]);
  document.getElementById('modalBody').innerHTML=`
    <div style="text-align:center;line-height:1.35">
      <div style="font-size:24px;font-weight:bold;margin-bottom:4px">8BITBOD</div>
      <div style="font-size:14px;margin-bottom:14px">Version ${VERSION} Alpha</div>
      <div style="font-size:18px;font-weight:bold;margin-bottom:7px">Credits</div>
      <div><b>Original game design</b><br>Tim Sharville, Paul Sharville &amp; Russ Law</div>
      <div style="margin-top:11px"><b>Digital adaptation &amp; artwork</b><br>Gunpowder Studios</div>
      <p style="margin:14px 0 8px"><b>8BITBOD</b> is based on the <b>Bag of Dungeon</b> board game for <b>1–4 players</b>.</p>
      <p style="margin:8px 0">Visit our website to see the full range:<br>
        <a href="https://www.gunpowderstudios.co.uk" target="_blank" rel="noopener noreferrer">www.gunpowderstudios.co.uk</a>
      </p>
      <p style="margin:14px 0 5px">© Gunpowder Studios Ltd. All rights reserved.</p>
      <p style="font-weight:bold;margin:12px 0 0">Thanks for playing, your journey continues over at our website.</p>
    </div>`;
}
function openMenu(){
  showModal('Menu','Game and display options.',[
    {text:'Resume',fn:closeModal},
    {text:'North Up',fn:()=>{
      closeModal();
      window.BOD3D?.northUp?.();
      resetCameraHeroTracking();
    }},
    {text:'About',fn:()=>{closeModal();openAbout();}},
    {text:'New Game',cls:'red',fn:()=>{closeModal();if(confirm('Start a new dungeon?'))showCharSelect();}}
  ]);
}

function showModal(title,body,buttons){document.getElementById('modalTitle').textContent=title;document.getElementById('modalBody').textContent=body;const mb=document.getElementById('modalButtons');mb.innerHTML='';buttons.forEach(x=>addBtn(mb,x.text,x.cls,x.fn));document.getElementById('modal').classList.add('open');}
function closeModal(){document.getElementById('modal').classList.remove('open');}
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.style.display='block';clearTimeout(el._t);el._t=setTimeout(()=>el.style.display='none',1500)}
function log(msg,cls){const d=document.createElement('div');d.className='logline '+(cls||'');d.textContent=msg;document.getElementById('log').appendChild(d);document.getElementById('log').scrollTop=99999;}
function tileAssetName(tile){
 // Item and monster locations keep their randomly drawn floor artwork.
 // Their markers are rendered separately as transparent overlays.
 if(!tile)return '';
 // Start was previously returned as lowercase "start", which did not match the
 // built-in asset key "Start" and therefore showed the SVG fallback crossroad.
 if(tile.kind==='start')return 'Start';
 if(tile.kind==='exit')return 'Exit';
 return TILE_LABEL[tile.kind]||tile.kind;
}
function tileSVG(tile){
 const name=tileAssetName(tile);
 const src=assetSrc(name);
 if(src){
   const deg=(tile.rot||0)*90;
   return `<img class="tileAsset" src="${src}" alt="${name}" style="transform:rotate(${deg}deg)">`;
 }
 const o=tile.opens,w=14,c=32;let path='';
 if(o.N)path+=`<rect x="${c-w}" y="0" width="${w*2}" height="${c+w}"/>`;
 if(o.S)path+=`<rect x="${c-w}" y="${c-w}" width="${w*2}" height="${c+w}"/>`;
 if(o.E)path+=`<rect x="${c-w}" y="${c-w}" width="${c+w}" height="${w*2}"/>`;
 if(o.W)path+=`<rect x="0" y="${c-w}" width="${c+w}" height="${w*2}"/>`;
 path+=`<rect x="${c-w-3}" y="${c-w-3}" width="${(w+3)*2}" height="${(w+3)*2}"/>`;
 return `<svg viewBox="0 0 64 64"><rect x="0" y="0" width="64" height="64" fill="var(--cream)"/><g fill="var(--ink)">${path}</g></svg>`;
}
function render(){
 if(!state)return;
 document.getElementById('stats').innerHTML=`<div class="sectionTitle">${state.charDef?state.charDef.name:'Adventurer'}</div><div class="row"><span>Health</span><b class="hp">${state.player.health}/${state.player.maxHealth}</b></div><div class="hearts">${heartLine(state.player.health,state.player.maxHealth)}</div><div class="row"><span>AP</span><b class="ap">${state.player.ap}/${state.player.maxAp}</b></div><div class="statline">Combat: ${pDice()}d6+${pCombatMod()} &nbsp; Armour: -${pDamageReduction()}</div><div class="statline">Lives: ${state.player.lives} &nbsp; Ring: ${state.player.hasRing?`<span class="ringStatus">${iconHTML('Ring','◎')}<b>YES</b></span>`:'no'}</div>`;
 renderInventory();
 renderKillTally();
 renderWorld();
 renderControls();
 renderDev();

 document.getElementById('deckBadge').textContent='Tiles '+state.tileDeck.length;
 document.getElementById('monsterBadge').textContent='Monsters '+state.monsterDeck.length;
 document.getElementById('itemBadge').textContent='Items '+state.itemDeck.length;

 const mobileStatus=document.getElementById('mobileStatus');
 if(mobileStatus){
  mobileStatus.innerHTML=`
   <div class="mobileHero">${state.charDef?.name||'Adventurer'}</div>
   <span>♥ ${state.player.health}/${state.player.maxHealth}</span>
   <span>AP ${state.player.ap}/${state.player.maxAp}</span>
   <span>🎒 ${occupiedSpaceCount()}/8</span>
   <span>${state.player.hasRing?'Ring ✓':'Ring —'}</span>
   <div class="mobileDecks">Tiles ${state.tileDeck.length} · Monsters ${state.monsterDeck.length} · Items ${state.itemDeck.length}</div>`;
 }
}

function slotSymbolHTML(slot){
 const base='assets/ui/';
 const img=(file,alt)=>`<img class="slotSymbol" src="${base}${file}?v=10.61" alt="${alt}" title="${alt}" onerror="this.style.display='none'">`;
 if(slot==='left'||slot==='right')return `<span class="slotSymbols">${img('hand-symbol.png','Hand')}<span class="slotSymbolDivider">/</span>${img('spell-symbol.png','Spell')}</span>`;
 if(slot==='armour')return `<span class="slotSymbols">${img('armour.png','Armour')}</span>`;
 if(slot==='boots')return `<span class="slotSymbols">${img('boots.png','Boots')}</span>`;
 if(slot==='cloak')return `<span class="slotSymbols">${img('attire.png','Attire')}</span>`;
 if(slot==='companion')return `<span class="slotSymbols">${img('companions.png','Companions')}</span>`;
 return '';
}
function slotHTML(label,item,slot){return `<div class="equipSlot"><span class="slotLabel">${slotSymbolHTML(slot)}<span class="slotLabelText">${label}</span></span>${item?`<div class="slotItem" onclick="inspectCarried('${slot}')"><div class="slotArt">${iconHTML(item.name,item.icon||'?')}</div><div class="slotName">${item.name}${isTwoHanded(item)?'<br><span class="twoHandedBadge">TWO-HANDED</span>':''}</div></div>`:'<div class="slotEmpty">Empty</div>'}</div>`;}
function renderInventory(){
 const p=state.player,el=document.getElementById('inventory');
 if(!Object.prototype.hasOwnProperty.call(p.slots,'cloak'))p.slots.cloak=null;
 const left=p.slots.left,right=p.slots.right;
 let html=`<div class="sectionTitle">Character</div>
 <div class="small">Hands and Attire are active while equipped. Companions use no inventory space.</div>
 <div class="sectionTitle">Hands</div>
 <div class="slotGrid">${slotHTML('Left Hand',left,'left')}${slotHTML('Right Hand',right,'right')}</div>
 <div class="sectionTitle">Attire</div>
 <div class="slotGrid">${slotHTML('Armour',p.slots.armour,'armour')}${slotHTML('Boots',p.slots.boots,'boots')}${slotHTML('Attire',p.slots.cloak,'cloak')}</div>
 <div class="sectionTitle">Inventory ${occupiedSpaceCount()}/8</div>
 <div class="small">Artifacts, crystals, bells, consumables and spare equipment all use inventory space.</div>
 <div class="sectionTitle">Backpack ${p.backpack.length}/4</div><div class="backpackGrid">`;
 for(let i=0;i<BACKPACK_LIMIT;i++){const it=p.backpack[i];html+=`<div class="backpackSlot">${it?`<div class="slotItem" onclick="inspectBackpack(${i})"><div class="slotArt">${iconHTML(it.name,it.icon||'?')}</div><div class="slotName">${it.name}</div><div class="slotDesc">${it.desc||'No effect description.'}</div></div>`:'<div class="slotEmpty">Empty</div>'}</div>`;}
 html+=`</div>
 <div class="sectionTitle">Companions</div>
 <div class="slotGrid"><div class="equipSlot wide"><span class="slotLabel">${slotSymbolHTML('companion')}<span class="slotLabelText">Companions</span></span>${p.companionBear?`<div class="slotItem" onclick="inspectBear()"><div class="slotArt">${iconHTML('Loyal Bear',p.companionBear.icon||'🐻')}</div><div class="slotName">Loyal Bear</div><div class="slotDesc">Does not use inventory space.</div></div>`:'<div class="slotEmpty">No companions</div>'}</div></div>`;
 const t=getTile(p.x,p.y);
 if(t&&t.droppedItems&&t.droppedItems.length)html+='<div class="sectionTitle">On this tile</div><div class="invgrid">'+t.droppedItems.map((x,i)=>`<button class="itemBtn" onclick="pickupDropped(${i})" title="Pick up ${x.name}">${iconHTML(x.name,x.icon||'?')}<span class="dropMark">+</span></button>`).join('')+'</div>';
 if(p.equipment.weapon&&p.equipment.weapon.name==='Magic Sword')html+=magicSwordPeekHTML();
 el.innerHTML=html;
}
function magicSwordPeekHTML(){const p=state.player;let rows=[];for(const dir of dirOrder){const d=DIRS[dir],t=getTile(p.x+d.dx,p.y+d.dy);if(t&&(t.monsterPending||(t.monster&&!t.monster.revealed)))rows.push(`<button class="peekBtn" onclick="peekMonster('${dir}')">View ${dir}</button>`);}return rows.length?'<div class="sectionTitle">Magic Sword</div><div class="small">View adjacent monster:</div>'+rows.join(' '):'';}
window.peekMonster=function(dir){const p=state.player,d=DIRS[dir],t=getTile(p.x+d.dx,p.y+d.dy);if(!t)return;if(t.monsterPending&&!t.monster){t.monster=drawMonster();t.monsterPending=false;}if(t.monster){t.monster.peeked=true;showModal('Magic Sword: '+dir,t.monster.name+'\nHealth '+t.monster.maxHealth+'\nCombat '+t.monster.dice+'d6+'+t.monster.mod,[{text:'Close',fn:closeModal}]);render();}};
function carriedAt(slot){return state.player.slots[slot];}
window.inspectCarried=function(slot){const item=carriedAt(slot);if(item)inspectItemObject(item);};window.inspectBackpack=function(idx){const item=state.player.backpack[idx];if(item)inspectItemObject(item);};window.inspectBear=function(){if(state.player.companionBear)inspectItemObject(state.player.companionBear);};
function inspectItemObject(item){const buttons=[];const eq=equippedSlotFor(item);if(item.type==='equipment'||isHandItem(item)||isAttire(item)){if(eq&&eq!=='companion')buttons.push({text:'Move to Backpack',fn:()=>{if(unequipItem(item)){closeModal();render();}}});if(isArmour(item)&&eq!=='armour')buttons.push({text:'Wear Armour',cls:'green',fn:()=>{if(equipToSlot(item,'armour')){closeModal();render();}}});else if(isBoots(item)&&eq!=='boots')buttons.push({text:'Wear Boots',cls:'green',fn:()=>{if(equipToSlot(item,'boots')){closeModal();render();}}});else if(isCloak(item)&&eq!=='attire')buttons.push({text:'Wear Attire',cls:'green',fn:()=>{if(equipToSlot(item,'cloak')){closeModal();render();}}});else if(isHandItem(item)&&eq!=='both hands'){buttons.push({text:isTwoHanded(item)?'Equip Both Hands':'Equip Left Hand',cls:'green',fn:()=>{if(equipToSlot(item,'left')){closeModal();render();}}});if(!isTwoHanded(item))buttons.push({text:'Equip Right Hand',cls:'green',fn:()=>{if(equipToSlot(item,'right')){closeModal();render();}}});}}
 if(!isChest(item)&&(item.type==='spell'||item.type==='consumable'||item.use))buttons.push({text:'Use',cls:'green',fn:()=>{closeModal();useItemObject(item);}});buttons.push({text:'Drop',cls:'red',fn:()=>dropItemObject(item)});buttons.push({text:'Close',fn:closeModal});showModal(item.name,(item.desc||'Item')+(eq?'\n\nActive: '+eq:''),buttons);}
function useItemObject(item){if(item.use==='iceStaff'){useItem(item);return;}useItem(item,()=>{removeFromCurrentLocation(item);state.itemDiscard.push(item);syncEquipment();render();});}
function useInventoryIndex(idx){const item=allCarriedItems()[idx];if(item)useItemObject(item);}

function renderKillTally(){const el=document.getElementById('killTally');if(!el||!state)return;const counts={};state.player.killed.forEach(n=>counts[n]=(counts[n]||0)+1);const names=Object.keys(counts);el.innerHTML='<div class="sectionTitle">Monster Tally</div>'+(names.length?'<div class="killGrid">'+names.map(n=>'<span>'+n+'</span><b>×'+counts[n]+'</b>').join('')+'</div>':'<div class="small">No monsters defeated yet.</div>')+'<div class="killTotal">Total kills: '+state.player.killed.length+'</div>';}

function boardInteractionLocked(){
 return !!combat || document.body.classList.contains('combatActive');
}

function removeTileItemObject(tile,item){
 if(!tile||!tile.droppedItems)return false;
 const idx=tile.droppedItems.indexOf(item);
 if(idx<0)return false;
 tile.droppedItems.splice(idx,1);
 if(!tile.droppedItems.length)delete tile.droppedItems;
 return true;
}
function openChestOnTile(tileKey,item){
 const tile=state.tiles[tileKey];
 if(!tile||!item||!isChest(item)||!tile.droppedItems||!tile.droppedItems.includes(item))return;
 if(tileKey!==key(state.player.x,state.player.y)){toast('Move onto the chest tile first');return;}
 removeTileItemObject(tile,item);
 const p=state.player;
 const chestRoll=roll(1);
 const r=chestRoll.total;
 playSound('dice');
 let msg='';
 let rewardCount=0;

 if(item.use==='smallChest'){
  if(r<=2){p.health-=2;msg='TRAPPED! Take 2 damage.';}
  else{rewardCount=1;msg='Small Chest opened: draw 1 item.';}
 }else{
  if(r<=2){p.health-=5;msg='TRAPPED! Take 5 damage.';}
  else{rewardCount=2;msg='Large Chest opened: draw 2 items.';}
 }

 state.itemDiscard.push(item);
 playSound('spell');
 log(msg,p.health<=0?'combat':'loot');
 toast(msg);
 closeModal();
 render();

 const finishChestResolution=()=>{
  if(p.health<=0){death();return;}
  for(let i=0;i<rewardCount;i++)awardItem();
  // Defensive restart: if a dice/modal timing race ever interrupted the queue,
  // explicitly resume the normal item-placement flow.
  if(pendingItemQueue.length) setTimeout(processPendingItem,40);
 };

 // The 3D die is visual only, but chest resolution now waits for it to finish
 // so its animation cannot overwrite or obscure the reward placement dialog.
 const dicePromise=window.BODDice3D?.roll?.(chestRoll.rolls,'hero');
 if(dicePromise&&typeof dicePromise.then==='function'){
  dicePromise.then(()=>{
   const wait=Math.max(0,Number(window.BODDice3D?.tuning?.duration||0))+120;
   setTimeout(finishChestResolution,wait);
  }).catch(()=>finishChestResolution());
 }else{
  finishChestResolution();
 }
}
function offerChestOnTile(tileKey,item){
 const tile=state.tiles[tileKey];
 if(!tile||!item||!isChest(item)||!tile.droppedItems||!tile.droppedItems.includes(item))return;
 const here=tileKey===key(state.player.x,state.player.y);
 const buttons=[
  ...(here?[{text:'Open Chest',cls:'green',fn:()=>openChestOnTile(tileKey,item)}]:[]),
  {text:'Leave It',fn:closeModal}
 ];
 showModal(
  item.name,
  ('Chest (may be trapped, may contain items).')+
  (here?'\n\nOpen it now, or leave it here and return later.':'\n\nMove onto this tile to open it.'),
  buttons
 );
}

function offerDroppedItems(){
 const tileKey=key(state.player.x,state.player.y);
 const t=state.tiles[tileKey];
 if(!t||!t.droppedItems||!t.droppedItems.length)return;
 if(boardInteractionLocked())return;
 const modal=document.getElementById('modal');
 if(modal&&modal.classList.contains('open'))return;
 showTileItems(tileKey);
}
function showTileItems(tileKey,event){
 if(event){event.preventDefault();event.stopPropagation();}
 if(boardInteractionLocked())return;
 const t=state.tiles[tileKey];
 if(!t||!t.droppedItems||!t.droppedItems.length)return;
 playSound('click');
 const here=tileKey===key(state.player.x,state.player.y);
 showModal('Items on this tile','',[{text:'Close',fn:closeModal}]);
 document.getElementById('modalBody').innerHTML=`<div>${here?'You are standing on this tile.':'Move onto this tile to interact with what is here.'}</div><div class="tileItemList">${t.droppedItems.map((item,i)=>{
  const action=isChest(item)
   ?(here?`<button style="margin-top:7px" onclick="openChestFromTile('${tileKey}',${i})">Open Chest</button>`:'<div class="small" style="margin-top:7px">Chest left unopened</div>')
   :(here?`<button style="margin-top:7px" onclick="pickupDroppedFromTile('${tileKey}',${i})">Pick up</button>`:'');
  return `<div class="tileItemCard"><div class="tileItemArt">${iconHTML(item.name,item.icon||'?')}</div><b>${item.name}</b><div class="small">${item.desc||''}</div>${action}</div>`;
 }).join('')}</div>`;
}
window.openChestFromTile=function(tileKey,idx){
 const t=state.tiles[tileKey];
 if(!t||!t.droppedItems||!t.droppedItems[idx]||!isChest(t.droppedItems[idx]))return;
 openChestOnTile(tileKey,t.droppedItems[idx]);
};
function beginDroppedPickup(tileKey,idx){
 if(tileKey!==key(state.player.x,state.player.y)){toast('Move onto that tile first');return;}
 const t=state.tiles[tileKey];
 if(!t||!t.droppedItems||!t.droppedItems[idx]){toast('That item is no longer on the tile');return;}
 const item=t.droppedItems[idx];
 if(isChest(item)){offerChestOnTile(tileKey,item);return;}
 closeModal();
 // Start the carry-placement choice first. Remove the floor item only once it has
 // successfully entered the pending pickup queue, preventing silent disappearance.
 setTimeout(()=>{
  if(!t.droppedItems||t.droppedItems[idx]!==item){toast('That item is no longer on the tile');return;}
  const queued=addToInventory(item,t);
  if(queued===false){toast('Could not pick up '+item.name);showTileItems(tileKey);return;}
  t.droppedItems.splice(idx,1);
  if(!t.droppedItems.length)delete t.droppedItems;
  render();
 },0);
}
window.pickupDroppedFromTile=function(tileKey,idx){beginDroppedPickup(tileKey,idx);};
function renderWorld(){const world=document.getElementById('world');world.innerHTML='';for(const k in state.tiles){const [x,y]=k.split(',').map(Number),t=state.tiles[k];const d=document.createElement('div');d.className='tile'+(teleportItem?' teleportTarget':'');d.dataset.tileKey=k;d.style.left=(x*STEP)+'px';d.style.top=(y*STEP)+'px';d.innerHTML=tileSVG(t);if(t.ringReveal)d.classList.add('ringReveal');if(TILE_GLYPH[t.kind]&&t.kind!=='start')d.innerHTML+=`<span class="tileOverlay">${iconHTML(TILE_LABEL[t.kind]||t.kind,TILE_GLYPH[t.kind])}</span>`;if(t.hasRing)d.innerHTML+=`<span class="ringMark">${iconHTML('Ring','💍')}</span>`;if(t.itemPending&&!t.itemUsed)d.innerHTML+=`<span class="itemLocationMarker">${iconHTML('Item Marker','Item')}</span>`;if(t.droppedItems&&t.droppedItems.length){
 const visible=t.droppedItems.slice(0,5);
 d.innerHTML+=`<span class="tileItemStack" role="button" tabindex="0" data-item-key="${k}" aria-label="View ${t.droppedItems.length} item${t.droppedItems.length===1?'':'s'} on this tile" title="Click to view items on this tile">${visible.map((item,i)=>`<span class="tileItemMarker">${iconHTML(item.name,item.icon||'?')}${i===visible.length-1&&t.droppedItems.length>visible.length?`<span class="tileItemCount">${t.droppedItems.length}</span>`:''}</span>`).join('')}</span>`;
}if((t.monsterPending)||(t.monster&&t.monster.health>0)){d.innerHTML+=(t.monster&&(t.monster.revealed||t.monster.peeked))?monsterBoardHTML(t.monster,rangedMode&&rangedMode.targetKeys.has(k)?' rangedTarget':'',k):`<span class="hiddenMonster${rangedMode&&rangedMode.targetKeys.has(k)?' rangedTarget':''}" role="button" tabindex="0" data-ranged-key="${k}">${iconHTML('Hidden Monster','M')}</span>`;}world.appendChild(d);wireBoardModels(d);
 const monsterButton=d.querySelector('.monsterGlyph');
 if(monsterButton){
  monsterButton.addEventListener('click',e=>rangedMode?fireRangedAt(monsterButton.dataset.monsterKey,e):showMonsterStats(monsterButton.dataset.monsterKey,e));
  monsterButton.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();(rangedMode?fireRangedAt(monsterButton.dataset.monsterKey,e):showMonsterStats(monsterButton.dataset.monsterKey,e));}});
 }
 const hiddenButton=d.querySelector('.hiddenMonster.rangedTarget');
 if(hiddenButton){hiddenButton.addEventListener('click',e=>fireRangedAt(hiddenButton.dataset.rangedKey,e));hiddenButton.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fireRangedAt(hiddenButton.dataset.rangedKey,e);}});}
 const itemButton=d.querySelector('.tileItemMarker');
 if(itemButton){
  itemButton.addEventListener('click',e=>showTileItems(itemButton.dataset.itemKey,e));
  itemButton.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showTileItems(itemButton.dataset.itemKey,e);}});
 }
 if(teleportItem){d.addEventListener('click',e=>teleportToTile(k,e));}
}const h=document.createElement('div');h.className='hero';h.innerHTML=state.charDef?iconHTML(state.charDef.name,state.charDef.glyph):iconHTML('Hero','🧑');const heroSize=TILE;const heroOffset=0;h.style.left=(state.player.x*STEP+heroOffset)+'px';h.style.top=(state.player.y*STEP+heroOffset)+'px';world.appendChild(h);wireBoardModels(h);applyPan();applyView3D();if(window.BOD3D&&view3d.enabled)window.BOD3D.render(state);}
window.BOD3DAction=function(type,tileKey){
 if(!state||boardInteractionLocked())return;
 if(type==='monster'){
  if(rangedMode)fireRangedAt(tileKey);
  else showMonsterStats(tileKey);
  return;
 }
 if(type==='hidden'&&rangedMode){fireRangedAt(tileKey);return;}
 if(type==='items'){showTileItems(tileKey);return;}
 if(type==='tile'&&teleportItem){teleportToTile(tileKey);return;}
};
function updateMobileDpad(){
 const dpad=document.getElementById('mobileDpad');
 if(!dpad||!state)return;

 const p=state.player;
 const canPayLay=p.ap>=1||!!(p.equipment.torch&&p.flags.torchFreeLay);
 const blocked=state.gameOver||!!combat||!!placement||!!teleportItem||!!rangedMode;

 dpad.querySelectorAll('.dpadBtn').forEach(btn=>{
  const dir=btn.dataset.dir;
  btn.dataset.action='';
  btn.disabled=true;
  btn.onclick=null;

  if(blocked)return;

  if(canMove(dir)){
   btn.dataset.action='move';
   btn.disabled=p.ap<1;
   btn.onclick=()=>move(dir);
   btn.title='Move '+dir;
  }else if(canLay(dir)){
   btn.dataset.action='lay';
   btn.disabled=!canPayLay;
   btn.onclick=()=>startPlace(dir);
   btn.title='Lay '+dir;
  }else{
   btn.title='Blocked';
  }
 });

 const rest=document.getElementById('mobileRestBtn');
 if(rest){
  rest.disabled=state.gameOver||!!combat||!!placement||!!teleportItem||!!rangedMode;
  rest.onclick=()=>endTurn(false);
 }
}

function renderControls(){
 const wrap=document.getElementById('controls');
 wrap.innerHTML='';
 updateMobileDpad();

 if(state.gameOver)return;
 if(teleportItem){addBtn(wrap,'Cancel Teleport','red',cancelTeleport);return;}
 if(rangedMode){addBtn(wrap,'Cancel Ranged Attack','red',cancelRangedAttack);return;}

 const p=state.player;
 if(p.equipment.bow)addBtn(wrap,p.equipment.bow.name+' — Range 1-3 (3 AP)','blue',()=>startRangedAttack('bow'),p.ap<3);
 if(p.equipment.staff)addBtn(wrap,'Ice Staff — Range 1-2 (4 AP)','blue',()=>startRangedAttack('iceStaff'),p.ap<4);

 // Directional movement/tile laying is handled by the shared N/E/S/W D-pad
 // on both desktop and mobile. Avoid rendering the old duplicate labelled row.

 if(p.ap<=0&&!p.flags.autoRestScheduled){
  p.flags.autoRestScheduled=true;
  setTimeout(()=>{
   if(
    state &&
    !state.gameOver &&
    !combat &&
    !placement &&
    !teleportItem &&
    !rangedMode &&
    state.player.ap<=0
   ){
    endTurn(true);
   }else if(state&&state.player&&state.player.flags){
    state.player.flags.autoRestScheduled=false;
   }
  },450);
 }
}
function applyView3D(){
 document.body.classList.toggle('threeMode',view3d.enabled);
 const btn=document.getElementById('viewBtn');
 if(btn)btn.textContent=view3d.enabled?'Map':'3D';
 if(window.BOD3D){
  window.BOD3D.setEnabled(view3d.enabled);
  if(view3d.enabled&&state)window.BOD3D.render(state);
 }
}
function fitFullMap(){
 if(!state||!state.tiles)return;
 const coords=Object.keys(state.tiles)
  .map(key=>key.split(',').map(Number))
  .filter(([x,y])=>Number.isFinite(x)&&Number.isFinite(y));
 if(!coords.length)return;
 const rect=document.getElementById('viewport').getBoundingClientRect();
 const xs=coords.map(([x])=>x),ys=coords.map(([,y])=>y);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const mapW=(maxX-minX+1)*STEP,mapH=(maxY-minY+1)*STEP;
 const pad=window.matchMedia('(max-width: 800px)').matches?24:48;
 pan.scale=Math.max(.2,Math.min(2.6,Math.min((rect.width-pad*2)/mapW,(rect.height-pad*2)/mapH)));
 const cx=(minX+maxX)*STEP/2+TILE/2,cy=(minY+maxY)*STEP/2+TILE/2;
 pan.x=rect.width/2-cx*pan.scale;pan.y=rect.height/2-cy*pan.scale;
 applyPan();
}
function toggleView3D(){
 view3d.enabled=!view3d.enabled;
 applyView3D();
 if(!view3d.enabled)setTimeout(fitFullMap,0);
}
function resetView3D(){
 view3d.enabled=true;
 applyView3D();
 if(window.BOD3D)window.BOD3D.resetCamera();
}
function applyPan(){document.getElementById('world').style.transform=`translate(${pan.x}px,${pan.y}px) scale(${pan.scale})`;}
function openingScale(){
  const rect=document.getElementById('viewport').getBoundingClientRect();
  const mobile=window.matchMedia('(max-width: 800px)').matches;
  const target=mobile ? rect.width*0.68 : Math.min(rect.width*0.30, 230);
  return Math.max(0.55,Math.min(mobile?2.1:1.45,target/TILE));
}
function setOpeningCamera(){pan.scale=openingScale();centreOnHero(false);}
function centreOnHero(smooth=true){
  if(!state||!state.player)return;
  const rect=document.getElementById('viewport').getBoundingClientRect();
  const world=document.getElementById('world');
  world.classList.toggle('cameraSmooth',!!smooth);
  pan.x=rect.width/2-(state.player.x*STEP+TILE/2)*pan.scale;
  pan.y=rect.height/2-(state.player.y*STEP+TILE/2)*pan.scale;
  applyPan();
  if(smooth)setTimeout(()=>world.classList.remove('cameraSmooth'),320);
}
function zoomAt(clientX,clientY,newScale){
  const rect=vp.getBoundingClientRect();
  const px=clientX-rect.left,py=clientY-rect.top;
  const wx=(px-pan.x)/pan.scale,wy=(py-pan.y)/pan.scale;
  pan.scale=Math.max(.45,Math.min(2.6,newScale));
  pan.x=px-wx*pan.scale;pan.y=py-wy*pan.scale;applyPan();
}
const vp=document.getElementById('viewport');
const activePointers=new Map();
let dragOrigin=null,pinchStart=null,lastTap=0;
vp.addEventListener('pointerdown',e=>{
  if(view3d.enabled)return;
  // Revealed monsters are interactive. Do not let map dragging capture their click/tap.
  if(e.target.closest&&e.target.closest('.monsterGlyph, .hiddenMonster.rangedTarget, .tileItemMarker, .teleportTarget'))return;
  activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  vp.setPointerCapture(e.pointerId);vp.classList.add('dragging');
  document.getElementById('world').classList.remove('cameraSmooth');
  if(activePointers.size===1){dragOrigin={x:e.clientX,y:e.clientY,panX:pan.x,panY:pan.y};pinchStart=null;}
  else if(activePointers.size===2){
    const pts=[...activePointers.values()];
    pinchStart={distance:Math.hypot(pts[1].x-pts[0].x,pts[1].y-pts[0].y),scale:pan.scale,midX:(pts[0].x+pts[1].x)/2,midY:(pts[0].y+pts[1].y)/2};
    dragOrigin=null;
  }
});
vp.addEventListener('pointermove',e=>{
  if(view3d.enabled)return;
  if(!activePointers.has(e.pointerId))return;
  activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(activePointers.size===2&&pinchStart){
    const pts=[...activePointers.values()];
    const dist=Math.hypot(pts[1].x-pts[0].x,pts[1].y-pts[0].y);
    const midX=(pts[0].x+pts[1].x)/2,midY=(pts[0].y+pts[1].y)/2;
    zoomAt(midX,midY,pinchStart.scale*(dist/Math.max(1,pinchStart.distance)));
  }else if(activePointers.size===1&&dragOrigin){
    pan.x=dragOrigin.panX+(e.clientX-dragOrigin.x);pan.y=dragOrigin.panY+(e.clientY-dragOrigin.y);applyPan();
  }
});
function endPointer(e){
  if(view3d.enabled)return;
  activePointers.delete(e.pointerId);
  if(activePointers.size===0){vp.classList.remove('dragging');dragOrigin=null;pinchStart=null;}
  else if(activePointers.size===1){const p=[...activePointers.values()][0];dragOrigin={x:p.x,y:p.y,panX:pan.x,panY:pan.y};pinchStart=null;}
}
vp.addEventListener('pointerup',endPointer);vp.addEventListener('pointercancel',endPointer);
vp.addEventListener('dblclick',e=>{e.preventDefault();centreOnHero(true);});
vp.addEventListener('touchend',e=>{if(e.touches.length)return;const now=Date.now();if(now-lastTap<320)centreOnHero(true);lastTap=now;},{passive:true});
vp.addEventListener('contextmenu',e=>{if(view3d.enabled)e.preventDefault();});
vp.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.clientX,e.clientY,pan.scale*(e.deltaY<0?1.12:0.89));},{passive:false});
window.addEventListener('resize',()=>{if(state)centreOnHero(false);});
document.getElementById('viewBtn').onclick=()=>{audio();toggleView3D();};
function migrateSave(){if(!state||!state.player)return;const p=state.player;p.slots=p.slots||{left:null,right:null,armour:null,boots:null};p.backpack=p.backpack||[];p.flags=p.flags||{};p.flags.bootsBonus=!!p.flags.bootsBonus;p.flags.torchFreeLay=!!p.flags.torchFreeLay;if(Array.isArray(p.inventory)&&!p.backpack.length){p.inventory.slice(0,4).forEach(x=>p.backpack.push(x));}p.companionBear=p.companionBear||null;p.inventory=[];syncEquipment();}


function saveGame(){
  try{localStorage.setItem('bodDigitalSaveV40',JSON.stringify({state,pan}));toast('Game saved.');}
  catch(e){alert('Could not save game: '+e.message);}
}
function loadGame(){
  try{const raw=localStorage.getItem('bodDigitalSaveV40') || localStorage.getItem('bodDigitalSaveV36') || localStorage.getItem('bodDigitalSaveV35');if(!raw){toast('No save found.');return;}const data=JSON.parse(raw);state=data.state;pan=data.pan||{x:0,y:0,scale:1};migrateSave();document.getElementById('charSelect').classList.add('hidden');render();centreOnHero(false);toast('Game loaded.');}
  catch(e){alert('Could not load game: '+e.message);}
}
function toggleDev(){devOpen=!devOpen;renderDev();}
function renderDev(){const el=document.getElementById('devPanel');if(!devOpen||!state){el.classList.remove('open');return;}el.classList.add('open');const p=state.player,t=getTile(p.x,p.y);el.textContent=`DEVELOPER ${VERSION}
Hero: ${state.charDef?.name||'-'}
Pos: ${p.x},${p.y}
Tile: ${t?.kind||'-'} rot ${t?.rot||0}
Open: ${t?Object.keys(t.opens).filter(d=>t.opens[d]).join(''):'-'}
AP: ${p.ap}/${p.maxAp}  HP: ${p.health}/${p.maxHealth}
Tiles deck: ${state.tileDeck.length}  laid: ${Object.keys(state.tiles).length}
M tiles laid: ${Object.values(state.tiles).filter(t=>t.mNumber>=2&&t.mNumber<=12).length}/11  in deck: ${state.tileDeck.filter(t=>t.mNumber>=2&&t.mNumber<=12).length}
Monster deck: ${state.monsterDeck.length}  discard: ${state.monsterDiscard?.length||0}
Item deck: ${state.itemDeck.length}  discard: ${state.itemDiscard?.length||0}
Exit placed: ${state.exitPlaced?'yes':'no'}
Ring carried: ${p.hasRing?'yes':'no'}  ring: ${state.ringNumber?'M'+state.ringNumber:'not rolled'}  tile: ${state.ringKey||'-'}
Inventory spaces: ${occupiedSpaceCount()}/8  Backpack: ${p.backpack.length}/4
Dropped here: ${t?.droppedItems?.length||0}
Kills: ${p.killed.length}
Turns: ${state.turns||1}`;}
function adventureStats(){const p=state.player;const mins=Math.max(0,Math.round((Date.now()-(state.startedAt||Date.now()))/60000));return `Turns: ${state.turns||1}\nTime: ${mins} mins\nKills: ${p.killed.length}`;}

document.getElementById('zoomIn').onclick=()=>{const r=vp.getBoundingClientRect();zoomAt(r.left+r.width/2,r.top+r.height/2,pan.scale*1.18)};
document.getElementById('zoomOut').onclick=()=>{const r=vp.getBoundingClientRect();zoomAt(r.left+r.width/2,r.top+r.height/2,pan.scale/1.18)};
const centreBtn=document.getElementById('centreBtn');
function centreHeroView(){
 if(document.body.classList.contains('threeMode')&&window.BOD3D){
  cameraLockedToHero=true;
  window.BOD3D.centreOnHero();
  resetCameraHeroTracking();
 }else{
  centreOnHero(true);
 }
}
function wireCentreControl(el){
 if(!el)return;
 let touchHandled=false;
 el.addEventListener('touchend',e=>{touchHandled=true;e.preventDefault();e.stopPropagation();centreHeroView();setTimeout(()=>{touchHandled=false;},350);},{passive:false});
 el.addEventListener('click',e=>{if(touchHandled)return;e.preventDefault();centreHeroView();});
}
wireCentreControl(centreBtn);
document.getElementById('northUpBtn').onclick=()=>{
 if(window.BOD3D){
  window.BOD3D.northUp();
  resetCameraHeroTracking();
 }
};
const compassEl=document.getElementById('compass');
if(compassEl){
 compassEl.onclick=()=>{
  if(window.BOD3D){
   window.BOD3D.northUp();
   resetCameraHeroTracking();
  }
 };
 compassEl.onkeydown=e=>{
  if(e.key==='Enter'||e.key===' '){
   e.preventDefault();
   compassEl.click();
  }
 };
}
document.getElementById('menuBtn').onclick=openMenu;

const mobileDpadCentre=document.querySelector('.dpadCentre');
wireCentreControl(mobileDpadCentre);

const mobileSheetToggle=document.getElementById('mobileSheetToggle');
const mobileSide=document.getElementById('side');

function setMobileSheetExpanded(expanded){
 if(!mobileSide||!mobileSheetToggle)return;
 mobileSide.classList.toggle('mobileExpanded',expanded);
 mobileSide.classList.toggle('mobileCollapsed',!expanded);
 mobileSheetToggle.setAttribute('aria-expanded',String(expanded));
 mobileSheetToggle.textContent=expanded?'Character & Inventory ▾':'Player Stats ▴';
}

if(mobileSheetToggle&&mobileSide){
 setMobileSheetExpanded(false);

 mobileSheetToggle.onclick=()=>{
  setMobileSheetExpanded(!mobileSide.classList.contains('mobileExpanded'));
 };

 let sheetTouchStartY=null;
 mobileSide.addEventListener('touchstart',e=>{
  sheetTouchStartY=e.touches?.[0]?.clientY??null;
 },{passive:true});

 mobileSide.addEventListener('touchend',e=>{
  if(sheetTouchStartY===null)return;
  const endY=e.changedTouches?.[0]?.clientY??sheetTouchStartY;
  const delta=endY-sheetTouchStartY;
  sheetTouchStartY=null;

  if(delta<-35)setMobileSheetExpanded(true);
  else if(delta>35)setMobileSheetExpanded(false);
 },{passive:true});
}

function keyboardDirection(e){
 const code=e.code||'';
 const key=String(e.key||'').toLowerCase();
 if(code==='ArrowUp'||code==='KeyW'||code==='Numpad8'||key==='8')return 'N';
 if(code==='ArrowRight'||code==='KeyD'||code==='Numpad6'||key==='6')return 'E';
 if(code==='ArrowDown'||code==='KeyS'||code==='Numpad2'||key==='2')return 'S';
 if(code==='ArrowLeft'||code==='KeyA'||code==='Numpad4'||key==='4')return 'W';
 return null;
}
function anyGameOverlayOpen(){
 return document.getElementById('modal').classList.contains('open')||document.getElementById('combat').classList.contains('open');
}

function cloneTesterItem(name){
 const master=ITEM_MASTER.find(item=>item.name===name);
 return master?{...master,_testerItem:true}:null;
}

function testerDropDisplaced(items){
 // Secret tester replacements are not physical game actions.
 // Remove the displaced test loadout instead of dropping copies on the board.
 return;
}

function testerRemoveBoardCopies(itemName){
 if(!state||!itemName)return;

 Object.values(state.tiles||{}).forEach(tile=>{
  if(!Array.isArray(tile.droppedItems))return;
  tile.droppedItems=tile.droppedItems.filter(item=>item?.name!==itemName);
 });
}

function testerEquipItem(name,slot){
 if(!state)return;
 const item=cloneTesterItem(name);
 if(!item)return;

 // Remove copies accidentally created by older tester builds.
 testerRemoveBoardCopies(name);

 const p=state.player;

 // Selecting the same item again should not create or displace another copy.
 if(
  (slot==='left'||slot==='right') &&
  p.slots[slot]?.name===name
 ){
  toast(name+' is already equipped');
  render();
  return true;
 }

 // Equipping an item that's also sitting in the backpack should move it,
 // not leave a second copy behind — otherwise passive item effects (AP
 // bonuses, light radius, etc.) get counted twice.
 p.backpack=p.backpack.filter(bp=>bp?.name!==name);

 if(slot==='armour'){
  if(p.slots.armour)testerDropDisplaced([p.slots.armour]);
  p.slots.armour=item;
 }else if(slot==='cloak'){
  if(p.slots.cloak)testerDropDisplaced([p.slots.cloak]);
  p.slots.cloak=item;
 }else if(slot==='boots'){
  if(p.slots.boots?.name==='Magic Boots'&&p.flags.bootsBonus){
   p.flags.bootsBonus=false;
   p.maxAp=Math.max(1,p.maxAp-1);
   p.ap=Math.min(p.ap,p.maxAp);
  }
  if(p.slots.boots)testerDropDisplaced([p.slots.boots]);
  p.slots.boots=item;
  if(item.name==='Magic Boots'&&!p.flags.bootsBonus){
   p.flags.bootsBonus=true;
   p.maxAp+=1;
   p.ap+=1;
  }
 }else if(slot==='bear'){
  if(p.companionBear)testerDropDisplaced([p.companionBear]);
  p.companionBear=item;
 }else if(slot==='left'||slot==='right'){
  if(isTwoHanded(item)){
   testerDropDisplaced([p.slots.left,p.slots.right]);
   p.slots.left=item;
   p.slots.right=item;
  }else{
   const displaced=p.slots[slot];
   if(displaced)testerDropDisplaced([displaced]);
   const other=slot==='left'?'right':'left';
   if(p.slots[other]===item)p.slots[other]=null;
   p.slots[slot]=item;
  }
 }

 syncEquipment();
 log('[TEST] Equipped '+item.name+'.','system');
 toast(item.name+' equipped for testing');
 render();
 return true;
}

function testerAddToBackpack(name){
 if(!state)return;
 const item=cloneTesterItem(name);
 if(!item)return;

 testerRemoveBoardCopies(name);

 if(isBear(item)){
  testerEquipItem(name,'bear');
  return;
 }

 const p=state.player;
 const equippedElsewhere=
  p.slots.left?.name===name ||
  p.slots.right?.name===name ||
  p.slots.armour?.name===name ||
  p.slots.boots?.name===name ||
  p.slots.cloak?.name===name ||
  p.companionBear?.name===name;
 if(equippedElsewhere){
  toast(name+' is already equipped');
  return;
 }

 if(state.player.backpack.length>=BACKPACK_LIMIT){
  toast('Backpack full — equip it directly or clear equipment');
  return;
 }

 const existing=state.player.backpack.find(backpackItem=>backpackItem?.name===name);
 if(existing){
  toast(name+' is already in the backpack');
  render();
  return true;
 }

 state.player.backpack.push(item);
 syncEquipment();
 log('[TEST] Added '+item.name+' to backpack.','system');
 toast(item.name+' added');
 render();
 return true;
}

function testerClearEquipment(){
 if(!state)return;
 const p=state.player;

 if(p.slots.boots?.name==='Magic Boots'&&p.flags.bootsBonus){
  p.flags.bootsBonus=false;
  p.maxAp=Math.max(1,p.maxAp-1);
  p.ap=Math.min(p.ap,p.maxAp);
 }

 p.slots={left:null,right:null,armour:null,boots:null,cloak:null};
 p.companionBear=null;
 syncEquipment();
 log('[TEST] Equipment cleared without dropping tester items.','system');
 render();
 toast('Equipment cleared');
}

function testerRestoreHero(){
 if(!state)return;
 const p=state.player;
 p.health=p.maxHealth;
 p.ap=p.maxAp;
 render();
 toast('Health and AP restored');
}

function itemTesterButtons(item,index){
 if(isArmour(item)){
  return `<button type="button" data-test-index="${index}" data-test-slot="armour">Wear</button>`;
 }
 if(isBoots(item)){
  return `<button type="button" data-test-index="${index}" data-test-slot="boots">Wear</button>`;
 }
 if(isCloak(item)){
  return `<button type="button" data-test-index="${index}" data-test-slot="cloak">Wear Attire</button>`;
 }
 if(isBear(item)){
  return `<button type="button" data-test-index="${index}" data-test-slot="bear">Add Bear</button>`;
 }
 if(isHandItem(item)){
  if(isTwoHanded(item)){
   return `<button type="button" data-test-index="${index}" data-test-slot="left">Equip Both Hands</button>`;
  }
  return `
   <button type="button" data-test-index="${index}" data-test-slot="left">Equip Left</button>
   <button type="button" data-test-index="${index}" data-test-slot="right">Equip Right</button>`;
 }
 return `<button type="button" data-test-index="${index}" data-test-pack="1">Add to Backpack</button>`;
}

function renderItemTester(filter=''){
 const grid=document.getElementById('itemTesterGrid');
 if(!grid)return;

 const query=String(filter||'').trim().toLowerCase();
 const indexedItems=ITEM_MASTER
  .map((item,index)=>({item,index}))
  .filter(({item})=>
   !query ||
   item.name.toLowerCase().includes(query) ||
   String(item.desc||'').toLowerCase().includes(query)
  );

 grid.innerHTML=indexedItems.map(({item,index})=>`
  <div class="itemTesterEntry">
   <div class="itemTesterArt">${iconHTML(item.name,item.icon||'?')}</div>
   <div>
    <div class="itemTesterName">${item.name}</div>
    <div class="itemTesterDesc">${item.desc||''}</div>
   </div>
   <div class="itemTesterButtons">
    ${itemTesterButtons(item,index)}
    ${isHandItem(item)||isArmour(item)||isBoots(item)||isBear(item)
      ?`<button type="button" data-test-index="${index}" data-test-pack="1">Backpack</button>`
      :''}
   </div>
  </div>
 `).join('');
}

function handleItemTesterClick(event){
 const button=event.target.closest('button[data-test-index]');
 if(!button)return;

 event.preventDefault();
 event.stopPropagation();

 const index=Number(button.dataset.testIndex);
 const item=ITEM_MASTER[index];
 if(!item){
  toast('Tester item not found');
  return;
 }

 if(button.dataset.testPack){
  testerAddToBackpack(item.name);
 }else{
  testerEquipItem(item.name,button.dataset.testSlot);
 }

 // Close after a successful selection so the changed equipment is immediately visible.
 closeItemTester();
}
function openItemTester(){
 if(!state){
  toast('Start a game first');
  return;
 }
 if(
  document.getElementById('placement').classList.contains('open') ||
  document.getElementById('combat').classList.contains('open')
 ){
  toast('Close the current action first');
  return;
 }

 closeModal();
 renderItemTester('');
 const panel=document.getElementById('itemTester');
 panel.classList.add('open');
 panel.setAttribute('aria-hidden','false');

 const search=document.getElementById('itemTesterSearch');
 search.value='';
 setTimeout(()=>search.focus(),30);
}

function closeItemTester(){
 const panel=document.getElementById('itemTester');
 panel.classList.remove('open');
 panel.setAttribute('aria-hidden','true');
}


function openDeveloperConsole(){
 if(!state){
  toast('Start a game first');
  return;
 }
 if(
  document.getElementById('placement').classList.contains('open') ||
  document.getElementById('combat').classList.contains('open')
 ){
  toast('Close the current action first');
  return;
 }

 closeModal();
 closeItemTester();

 const select=document.getElementById('developerMonsterSelect');
 if(select&&!select.options.length){
  select.innerHTML=MONSTER_MASTER.map((monster,index)=>
   `<option value="${index}">${monster.name}</option>`
  ).join('');
 }

 const consoleEl=document.getElementById('developerConsole');
 consoleEl.classList.add('open');
 consoleEl.setAttribute('aria-hidden','false');
}

function closeDeveloperConsole(){
 const consoleEl=document.getElementById('developerConsole');
 consoleEl.classList.remove('open');
 consoleEl.setAttribute('aria-hidden','true');
}

function developerSpawnMonster(){
 if(!state)return;
 const select=document.getElementById('developerMonsterSelect');
 const master=MONSTER_MASTER[Number(select?.value||0)];
 if(!master)return;

 const tile=getTile(state.player.x,state.player.y);
 if(tile.monster&&tile.monster.health>0){
  toast('A living monster is already on this tile');
  return;
 }

 const monster={...master};
 monster.health=monster.maxHealth;
 monster.revealed=true;
 tile.monster=monster;
 tile.monsterPending=false;
 log('[TEST] Spawned '+monster.name+' on the current tile.','system');
 render();
 toast(monster.name+' spawned');
}

function developerRevealMonsters(){
 if(!state)return;
 let count=0;
 Object.values(state.tiles).forEach(tile=>{
  if(tile.monsterPending&&!tile.monster){
   tile.monster=drawMonster();
   tile.monsterPending=false;
  }
  if(tile.monster&&tile.monster.health>0){
   tile.monster.revealed=true;
   count++;
  }
 });
 render();
 toast(count+' monster'+(count===1?'':'s')+' revealed');
}

function developerKillCurrentMonster(){
 if(!state)return;
 const tile=getTile(state.player.x,state.player.y);
 const monster=tile?.monster;
 if(!monster||monster.health<=0){
  toast('No living monster on this tile');
  return;
 }

 monster.health=0;
 state.player.killed.push(monster.name);
 state.monsterDiscard.push(monster);
 recordMonsterCorpse(tile,key(state.player.x,state.player.y),monster);
 tile.monster=null;
 log('[TEST] Removed '+monster.name+' from the current tile.','system');
 render();
 toast(monster.name+' removed');
}

function developerGiveRing(){
 if(!state)return;
 state.player.hasRing=true;
 state.ringActivated=true;
 Object.values(state.tiles).forEach(tile=>{tile.hasRing=false;});
 log('[TEST] Ring of Creation given to hero.','system');
 render();
 toast('Ring given');
}

function developerPlaceRingHere(){
 if(!state)return;
 const tileKey=key(state.player.x,state.player.y);
 Object.values(state.tiles).forEach(tile=>{tile.hasRing=false;});
 const tile=state.tiles[tileKey];
 tile.hasRing=true;
 state.ringActivated=true;
 state.ringKey=tileKey;
 state.player.hasRing=false;
 log('[TEST] Ring placed on current tile.','system');
 render();
 toast('Ring placed here');
}

function developerClearCurrentDrops(){
 if(!state)return;
 const tile=getTile(state.player.x,state.player.y);
 tile.droppedItems=[];
 render();
 toast('Current tile loot cleared');
}

function developerRestore(){
 if(!state)return;
 state.player.health=state.player.maxHealth;
 state.player.ap=state.player.maxAp;
 render();
 toast('Health and AP restored');
}


function shuffledDirections(){
 return shuffle(['N','E','S','W']);
}

function validRotationsForConnection(kind,requiredDirection){
 const rotations=[];
 for(let rotation=0;rotation<4;rotation++){
  if(openings(kind,rotation)[requiredDirection])rotations.push(rotation);
 }
 return rotations;
}

function developerBuildCompleteDungeon(withMonsters){
 if(!state)return;

 if(!confirm(
  withMonsters
   ?'Replace the current dungeon with a complete random dungeon containing revealed monsters?'
   :'Replace the current dungeon with a complete random tiles-only dungeon?'
 ))return;

 closeDeveloperConsole();
 closeModal();
 closeCombat();

 // Reset transient actions before rebuilding the board.
 placement=null;
 rangedMode=null;
 teleportItem=null;
 pendingItemQueue=[];
 state.gameOver=false;
 state.exitPlaced=false;
 state.ringActivated=false;
 state.ringKey=null;
 state.ringNumber=null;
 state.ringRoll=null;

 // Reset the hero to the Start tile while retaining the current character/loadout.
 state.player.x=0;
 state.player.y=0;
 state.player.prevX=0;
 state.player.prevY=0;
 state.player.facing='S';
 state.player.ap=state.player.maxAp;

 // Fresh random bags.
 const deck=createTileDeck();
 state.monsterDeck=expanded(MONSTER_MASTER);
 state.itemDeck=expanded(ITEM_MASTER);
 state.tileDiscard=[];
 state.monsterDiscard=[];
 state.itemDiscard=[];

 const generated={
  '0,0':{
   kind:'start',
   opens:{...TILE_BASE.start},
   rot:0,
   visited:true
  }
 };

 const frontier=[{x:0,y:0}];

 function findPlacement(raw){
  const candidates=[];

  for(const origin of frontier){
   const originTile=generated[key(origin.x,origin.y)];
   if(!originTile)continue;

   for(const direction of shuffledDirections()){
    if(!originTile.opens[direction])continue;

    const delta=DIRS[direction];
    const x=origin.x+delta.dx;
    const y=origin.y+delta.dy;
    const tileKey=key(x,y);
    if(generated[tileKey])continue;

    const required=delta.opp;
    const rotations=validRotationsForConnection(raw.kind,required);
    if(!rotations.length)continue;

    candidates.push({
     x,y,
     direction,
     rot:rotations[Math.floor(Math.random()*rotations.length)]
    });
   }
  }

  if(!candidates.length)return null;
  return candidates[Math.floor(Math.random()*candidates.length)];
 }

 // Lay every ordinary tile in the real deck.
 while(deck.length){
  const raw=deck.pop();
  const placementChoice=findPlacement(raw);

  if(!placementChoice){
   console.warn('Complete dungeon generation stopped early.',raw);
   break;
  }

  const tile={
   ...raw,
   rot:placementChoice.rot,
   opens:openings(raw.kind,placementChoice.rot),
   visited:false
  };

  if(withMonsters){
   maybePopulate(tile);

   if(tile.monsterPending){
    tile.monster=drawMonster();
    tile.monsterPending=false;
    if(tile.monster)tile.monster.revealed=true;
   }
  }else{
   delete tile.monsterMarker;
   delete tile.mNumber;
   delete tile.monsterPending;
   delete tile.monster;
   delete tile.itemMarker;
   delete tile.itemPending;
   delete tile.item;
  }

  generated[key(placementChoice.x,placementChoice.y)]=tile;
  frontier.push({x:placementChoice.x,y:placementChoice.y});
  state.tileDiscard.push(raw);
 }

 // Add the Exit as the final connected tile.
 const exitRaw={kind:'exit'};
 const exitPlacement=findPlacement(exitRaw);

 if(exitPlacement){
  const exitTile={
   kind:'exit',
   rot:exitPlacement.rot,
   opens:openings('exit',exitPlacement.rot),
   visited:false
  };

  generated[key(exitPlacement.x,exitPlacement.y)]=exitTile;
  state.exitPlaced=true;
 }

 state.tiles=generated;
 state.tileDeck=[];

 if(withMonsters){
  log('[TEST] Spawned a complete random dungeon with revealed monsters.','system');
 }else{
  log('[TEST] Spawned a complete random tiles-only dungeon.','system');
 }

 // Reset Three.js tracking so the rebuilt board and hero appear reliably.
 if(window.BOD3D){
  window.BOD3D.resetHeroFacing?.();
  window.BOD3D.resetHeroTracking?.();
 }

 render();

 setTimeout(()=>{
  window.BOD3D?.centreOnHero?.();
 },80);

 toast(
  withMonsters
   ?'Complete dungeon and monsters spawned'
   :'Complete tiles-only dungeon spawned'
 );
}

function developerAction(action){
 switch(action){
  case 'items':
   closeDeveloperConsole();
   openItemTester();
   break;
  case 'save':
   saveGame();
   toast('Game saved');
   break;
  case 'load':
   closeDeveloperConsole();
   loadGame();
   break;
  case 'restore':
   developerRestore();
   break;
  case 'ring':
   developerGiveRing();
   break;
  case 'ring-tile':
   developerPlaceRingHere();
   break;
  case 'clear-equipment':
   testerClearEquipment();
   break;
  case 'centre':
   window.BOD3D?.centreOnHero?.();
   toast('Camera centred');
   break;
  case 'spawn-monster':
   developerSpawnMonster();
   break;
  case 'spawn-dungeon-monsters':
   developerBuildCompleteDungeon(true);
   break;
  case 'spawn-dungeon-tiles':
   developerBuildCompleteDungeon(false);
   break;
  case 'reveal-monsters':
   developerRevealMonsters();
   break;
  case 'kill-monster':
   developerKillCurrentMonster();
   break;
  case 'clear-drops':
   developerClearCurrentDrops();
   break;
  case 'assets':
   closeDeveloperConsole();
   openAssetManager();
   break;
  case 'sounds':
   closeDeveloperConsole();
   openSoundManager();
   break;
 }
}

function wireDeveloperConsole(){
 const consoleEl=document.getElementById('developerConsole');
 const closeButton=document.getElementById('developerConsoleClose');
 if(!consoleEl||!closeButton)return;

 closeButton.onclick=closeDeveloperConsole;

 // v10.93 live dice-animation tuning controls.
 const diceInputs={
  duration:['diceDuration','diceDurationValue','duration',v=>`${Math.round(v)} ms`],
  drop:['diceDrop','diceDropValue','dropHeight',v=>Number(v).toFixed(2)],
  bounce1:['diceBounce1','diceBounce1Value','bounce1',v=>Number(v).toFixed(2)],
  bounce2:['diceBounce2','diceBounce2Value','bounce2',v=>Number(v).toFixed(2)],
  spread:['diceSpread','diceSpreadValue','spread',v=>Number(v).toFixed(2)],
  gap:['diceGap','diceGapValue','gap',v=>Number(v).toFixed(2)],
  floorOffset:['diceFloorOffset','diceFloorOffsetValue','floorOffset',v=>Number(v).toFixed(3)]
 };
 Object.values(diceInputs).forEach(([inputId,valueId,key,format])=>{
  const input=document.getElementById(inputId),value=document.getElementById(valueId);
  if(!input)return;
  if(window.BODDice3D?.tuning?.[key]!==undefined)input.value=window.BODDice3D.tuning[key];
  const sync=()=>{
   const n=Number(input.value);
   window.BODDice3D?.setTuning?.({[key]:n});
   if(value)value.textContent=format(n);
  };
  input.addEventListener('input',sync);
  sync();
 });
 document.getElementById('devTestHeroDice')?.addEventListener('click',()=>window.BODDice3D?.roll?.([r6(),r6()],'hero'));
 document.getElementById('devTestMonsterDice')?.addEventListener('click',()=>window.BODDice3D?.roll?.([r6(),r6()],'monster'));
 document.getElementById('devTestCombatDice')?.addEventListener('click',()=>window.BODDice3D?.rollCombat?.([r6(),r6()],[r6(),r6()]));
 document.getElementById('devClearDice')?.addEventListener('click',()=>window.BODDice3D?.clear?.());
 const calRole=document.getElementById('diceCalRole');
 const calFace=document.getElementById('diceCalFace');
 document.getElementById('diceCalShow')?.addEventListener('click',()=>window.BODDice3D?.showCalibration?.(calRole?.value||'hero',Number(calFace?.value||6)));
 document.getElementById('diceCalSave')?.addEventListener('click',()=>{window.BODDice3D?.saveCalibration?.(calRole?.value||'hero',Number(calFace?.value||6));toast('Dice face calibration saved');});
 consoleEl.querySelectorAll('[data-dice-cal-axis]').forEach(btn=>btn.addEventListener('click',()=>window.BODDice3D?.rotateCalibration?.(btn.dataset.diceCalAxis,Number(btn.dataset.diceCalAngle||0))));

 consoleEl.addEventListener('click',event=>{
  if(event.target===consoleEl){
   closeDeveloperConsole();
   return;
  }

  const tab=event.target.closest('[data-dev-tab]');
  if(tab){
   consoleEl.querySelectorAll('[data-dev-tab]').forEach(button=>
    button.classList.toggle('active',button===tab)
   );
   consoleEl.querySelectorAll('[data-dev-panel]').forEach(panel=>
    panel.classList.toggle('active',panel.dataset.devPanel===tab.dataset.devTab)
   );
   return;
  }

  const actionButton=event.target.closest('[data-dev-action]');
  if(actionButton){
   event.preventDefault();
   developerAction(actionButton.dataset.devAction);
  }
 });
}

function handleGameKeyboard(e){
 if(
  e.code==='Escape' &&
  document.getElementById('developerConsole').classList.contains('open')
 ){
  e.preventDefault();
  closeDeveloperConsole();
  return;
 }

 if(
  e.code==='Escape' &&
  document.getElementById('itemTester').classList.contains('open')
 ){
  e.preventDefault();
  closeItemTester();
  return;
 }

 // Hidden tester shortcuts. These are intentionally absent from the player-facing menu.
 // Mac: Control + Option + Shift. Windows: Ctrl + Alt + Shift.
 // S = save, L = load, A = Asset Manager, M = Sound Manager, I = Item Tester, D = Developer Console.
 if(e.ctrlKey&&e.altKey&&e.shiftKey&&!e.metaKey){
  if(e.code==='KeyS'){
   e.preventDefault();
   if(state)saveGame();else toast('No active game to save.');
   return;
  }
  if(e.code==='KeyL'){
   e.preventDefault();
   loadGame();
   return;
  }
  if(e.code==='KeyA'){
   e.preventDefault();
   if(document.getElementById('placement').classList.contains('open')||document.getElementById('combat').classList.contains('open'))return;
   closeModal();openAssetManager();
   return;
  }
  if(e.code==='KeyM'){
   e.preventDefault();
   if(document.getElementById('placement').classList.contains('open')||document.getElementById('combat').classList.contains('open'))return;
   closeModal();openSoundManager();
   return;
  }
  if(e.code==='KeyI'){
   e.preventDefault();
   openItemTester();
   return;
  }
  if(e.code==='KeyD'){
   e.preventDefault();
   openDeveloperConsole();
   return;
  }
 }
 const target=e.target;
 if(target&&(/INPUT|TEXTAREA|SELECT/.test(target.tagName)||target.isContentEditable))return;
 if(!state||!document.getElementById('charSelect').classList.contains('hidden'))return;
 const placementOpen=document.getElementById('placement').classList.contains('open');
 if(placementOpen){
  if(e.code==='ArrowRight'||e.code==='KeyD'||e.code==='Numpad6'){
   e.preventDefault();placement.rot=(placement.rot+1)%4;showPlacement();return;
  }
  if(e.code==='ArrowLeft'||e.code==='KeyA'||e.code==='Numpad4'){
   e.preventDefault();placement.rot=(placement.rot+3)%4;showPlacement();return;
  }
  if(e.code==='Enter'||e.code==='NumpadEnter'){
   e.preventDefault();if(!document.getElementById('placeBtn').disabled)document.getElementById('placeBtn').click();return;
  }
  if(e.code==='Escape'){
   e.preventDefault();document.getElementById('cancelPlace').click();return;
  }
  return;
 }
 if(anyGameOverlayOpen()||state.gameOver||teleportItem||rangedMode)return;
 const dir=keyboardDirection(e);if(!dir)return;
 e.preventDefault();
 if(canMove(dir)){move(dir);return;}
 if(canLay(dir)){
  const p=state.player,canPay=p.ap>=1||!!(p.equipment.torch&&p.flags.torchFreeLay);
  if(canPay)startPlace(dir);else toast('Not enough AP');
 }
}
document.addEventListener('keydown',handleGameKeyboard);

function wireItemTester(){
 const closeButton=document.getElementById('itemTesterClose');
 const healButton=document.getElementById('testerHeal');
 const clearButton=document.getElementById('testerClear');
 const search=document.getElementById('itemTesterSearch');
 const panel=document.getElementById('itemTester');

 if(!closeButton||!healButton||!clearButton||!search||!panel)return;

 closeButton.onclick=closeItemTester;
 healButton.onclick=testerRestoreHero;
 clearButton.onclick=testerClearEquipment;

 search.addEventListener('input',event=>{
  renderItemTester(event.target.value);
 });

 panel.addEventListener('click',event=>{
  if(event.target.id==='itemTester'){
   closeItemTester();
   return;
  }
  handleItemTesterClick(event);
 });
}

if(document.readyState==='loading'){
 document.addEventListener('DOMContentLoaded',()=>{
  wireItemTester();
  wireDeveloperConsole();
 });
}else{
 wireItemTester();
 wireDeveloperConsole();
}

function win(){state.gameOver=true;sndWin();closeCombat();showModal('YOU ESCAPED!','You defeated the Dragon and escaped with the Ring of Creation.\n\n'+adventureStats(),[{text:'New Game',cls:'green',fn:()=>{showCharSelect();}}]);}
function lose(){state.gameOver=true;sndLose();closeCombat();showModal('GAME OVER','The dungeon claims another adventurer.\n\n'+adventureStats(),[{text:'New Game',cls:'green',fn:()=>{showCharSelect();}}]);}

// v11.19: Clear any settled or still-animating dice at the start of a new game.
// The death() wrapper lives in combat.js because combat.js loads after this file.
const newGameWithoutDiceCleanup=newGame;
newGame=function(){window.BODDice3D?.clear?.();return newGameWithoutDiceCleanup.apply(this,arguments);};
renderCharSelect();
