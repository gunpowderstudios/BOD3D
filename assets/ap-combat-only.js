// BOD3D-TEST v11.56 — AP is reserved for combat; exploration Rest is hidden
(function(){
  function install(){
    if(window.__bodCombatOnlyAPInstalled)return true;
    if(typeof move!=='function'||typeof startPlace!=='function')return false;
    window.__bodCombatOnlyAPInstalled=true;

    const originalMove=move;
    move=function(){
      if(!state?.player)return originalMove.apply(this,arguments);
      const savedAp=state.player.ap;
      if(savedAp<1)state.player.ap=1;
      const result=originalMove.apply(this,arguments);
      state.player.ap=savedAp;
      if(typeof render==='function')render();
      return result;
    };

    const originalStartPlace=startPlace;
    startPlace=function(){
      if(!state?.player)return originalStartPlace.apply(this,arguments);
      const savedAp=state.player.ap;
      if(savedAp<1)state.player.ap=1;
      const result=originalStartPlace.apply(this,arguments);
      state.player.ap=savedAp;
      return result;
    };

    function patchPlaceButton(){
      const button=document.getElementById('placeBtn');
      if(!button||button.__bodFreePlacementPatched||typeof button.onclick!=='function')return;
      const original=button.onclick;
      button.onclick=function(){
        const savedAp=state?.player?.ap;
        const result=original.apply(this,arguments);
        if(state?.player&&Number.isFinite(savedAp))state.player.ap=savedAp;
        if(typeof render==='function')render();
        return result;
      };
      button.__bodFreePlacementPatched=true;
    }

    function hideExplorationRest(){
      document.querySelectorAll('button').forEach(button=>{
        const label=((button.id||'')+' '+(button.className||'')+' '+(button.textContent||'')).toLowerCase();
        if(/\brest\b/.test(label)&&!button.closest('#combat')){
          button.style.setProperty('display','none','important');
          button.setAttribute('aria-hidden','true');
          button.tabIndex=-1;
        }
      });
      patchPlaceButton();
    }

    hideExplorationRest();
    new MutationObserver(hideExplorationRest).observe(document.documentElement,{subtree:true,childList:true,characterData:true});
    return true;
  }

  function start(){
    if(install())return;
    let attempts=0;
    const timer=setInterval(()=>{if(install()||++attempts>160)clearInterval(timer);},50);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
