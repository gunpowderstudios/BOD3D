// BOD3D — unique item deck, end-game music and cache-version loader
(function(){
  const BUILD=(document.currentScript&&new URL(document.currentScript.src,location.href).searchParams.get('v'))||'12.76';
  const VERSION='v'+BUILD;
  window.BOD3D_BUILD_VERSION=VERSION;
  function syncVersion(){document.title='Play Bag of Dungeon 3D Free Online | Gunpowder Studios';const visible=document.getElementById('visibleBuildVersion');if(visible)visible.textContent=VERSION;}
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
      document.getElementById('modal')?.classList.add('rewardChoiceModal');
  const body=document.getElementById('modalBody');
      if(body){
        body.innerHTML=
          '<div style="margin-bottom:14px">This powerful monster carried two items. Choose one—the other goes back in the bag.</div>'+
          '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;align-items:stretch">'+
          items.map(item=>
            '<div class="rewardChoiceCard">'+
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
  function start(){syncVersion();if(installRewards())return;let attempts=0;const timer=setInterval(()=>{syncVersion();if(installRewards()||++attempts>240)clearInterval(timer);},50);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  setTimeout(syncVersion,900);
})();
