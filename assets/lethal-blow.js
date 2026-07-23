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
      window.BOD3D?.combatPulse?.();
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
