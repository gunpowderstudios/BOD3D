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
