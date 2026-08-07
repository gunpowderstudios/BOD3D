// BOD3D — Magic Sword click-to-view adjacent hidden monster
(function(){
  'use strict';
  if(window.__bodMagicSwordTargetInstalled)return;
  window.__bodMagicSwordTargetInstalled=true;

  let armed=false;

  function gameState(){return typeof state!=='undefined'?state:null;}
  function equippedMagicSword(){
    const p=gameState()?.player;
    if(!p)return null;
    return [p.slots?.left,p.slots?.right].find(item=>item?.name==='Magic Sword')||null;
  }

  function isAdjacentConnected(tileKey){
    const p=gameState()?.player;
    if(!p||!tileKey)return false;
    const parts=String(tileKey).split(',').map(Number);
    if(parts.length!==2||parts.some(n=>!Number.isFinite(n)))return false;
    const [tx,ty]=parts;
    const dx=tx-p.x,dy=ty-p.y;
    if(Math.abs(dx)+Math.abs(dy)!==1)return false;
    const dir=dx===1?'E':dx===-1?'W':dy===1?'S':'N';
    const current=typeof getTile==='function'?getTile(p.x,p.y):null;
    const target=typeof getTile==='function'?getTile(tx,ty):null;
    const d=(typeof DIRS!=='undefined')?DIRS[dir]:null;
    return !!(current&&target&&d&&current.opens?.[dir]&&target.opens?.[d.opp]);
  }

  function reveal(tileKey){
    if(!armed)return false;
    const sword=equippedMagicSword();
    if(!sword){armed=false;if(typeof toast==='function')toast('Equip the Magic Sword first');return true;}
    if(!isAdjacentConnected(tileKey)){
      if(typeof toast==='function')toast('Choose an adjacent connected monster');
      return true;
    }
    const t=gameState()?.tiles?.[tileKey];
    if(!t||(!t.monsterPending&&!(t.monster&&t.monster.health>0&&!t.monster.revealed))){
      if(typeof toast==='function')toast('That is not an unidentified adjacent monster');
      return true;
    }
    if(t.monsterPending&&!t.monster){t.monster=drawMonster();t.monsterPending=false;}
    if(!t.monster){if(typeof toast==='function')toast('No monster there');return true;}
    armed=false;
    t.monster.peeked=true;
    if(typeof playItemSound==='function')playItemSound(sword);
    showModal('MAGIC SWORD',t.monster.name+'\nHealth '+t.monster.health+'/'+t.monster.maxHealth+'\nCombat '+t.monster.dice+'d6+'+t.monster.mod,[{text:'Close',fn:closeModal}]);
    if(typeof render==='function')render();
    return true;
  }

  function arm(){
    if(!equippedMagicSword()){
      if(typeof toast==='function')toast('Equip the Magic Sword first');
      return;
    }
    const p=gameState().player;
    let found=false;
    for(const [dir,d] of Object.entries(typeof DIRS!=='undefined'?DIRS:{})){
      const t=typeof getTile==='function'?getTile(p.x+d.dx,p.y+d.dy):null;
      const current=typeof getTile==='function'?getTile(p.x,p.y):null;
      if(current&&t&&current.opens?.[dir]&&t.opens?.[d.opp]&&(t.monsterPending||(t.monster&&t.monster.health>0&&!t.monster.revealed))){found=true;break;}
    }
    if(!found){if(typeof toast==='function')toast('No hidden monster on an adjacent connected tile');return;}
    armed=true;
    if(typeof closeModal==='function')closeModal();
    if(typeof toast==='function')toast('Magic Sword ready — click the adjacent monster');
  }

  function addUseButton(){
    const mb=document.getElementById('modalButtons');
    if(!mb||document.getElementById('magicSwordUseBtn'))return;
    const b=document.createElement('button');
    b.id='magicSwordUseBtn';
    b.type='button';
    b.className='green';
    b.textContent='Use Magic Sword';
    b.onclick=arm;
    mb.insertBefore(b,mb.firstChild);
  }

  const originalInspectCarried=window.inspectCarried;
  if(typeof originalInspectCarried==='function'){
    window.inspectCarried=function(slot){
      originalInspectCarried(slot);
      const item=gameState()?.player?.slots?.[slot];
      if(item?.name==='Magic Sword')addUseButton();
    };
  }

  const originalAction=window.BOD3DAction;
  window.BOD3DAction=function(type,tileKey){
    if(armed&&(type==='hidden'||type==='monster')){if(reveal(tileKey))return;}
    return originalAction?.apply(this,arguments);
  };

  document.addEventListener('click',event=>{
    if(!armed)return;
    const marker=event.target.closest?.('.hiddenMonster');
    if(!marker)return;
    const tile=marker.closest?.('.tile');
    const tileKey=tile?.dataset?.tileKey;
    if(!tileKey)return;
    event.preventDefault();event.stopPropagation();
    reveal(tileKey);
  },true);

  window.BODMagicSwordCancel=function(){armed=false;};
})();
