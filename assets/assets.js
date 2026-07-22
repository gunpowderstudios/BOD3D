window.ASSET_PATHS = {
  "Start": "assets/tiles/start.png",
  "Exit": "assets/tiles/exit.png",
  "Straight": "assets/tiles/straight.png",
  "Corner": "assets/tiles/corner.png",
  "T-Junction": "assets/tiles/tjunction.png",
  "Crossroad": "assets/tiles/crossroad.png",
  "Spike Trap": "assets/tiles/spiketrap.png",
  "Healing Pool": "assets/tiles/healingpool.png",
  "Hidden Monster": "assets/ui/hiddenmonster.png",
  "Ring": "assets/ui/ring.png",

  "Sirrus the Fighter": "assets/heroes/sirrus.png",
  "Tamara the Fighter": "assets/heroes/tamara.png",
  "Duric the Dwarf": "assets/heroes/duric.png",
  "Marria the Dwarf": "assets/heroes/marria.png",
  "Rill the Healer": "assets/heroes/rill.png",
  "Tarak the Healer": "assets/heroes/tarak.png",
  "Alendra the Elf": "assets/heroes/alendra.png",
  "Galhorn the Elf": "assets/heroes/galhorn.png",

  "Goblin": "assets/monsters/goblin.png",
  "Zombie": "assets/monsters/zombie.png",
  "Mummy": "assets/monsters/mummy.png",
  "Monk": "assets/monsters/monk.png",
  "Mud Monster": "assets/monsters/mudmonster.png",
  "Werewolf": "assets/monsters/werewolf.png",
  "Troll": "assets/monsters/troll.png",
  "Minotaur": "assets/monsters/minotaur.png",
  "Skeleton": "assets/monsters/skeleton.png",
  "Giant Snake": "assets/monsters/giantsnake.png",
  "Reacher": "assets/monsters/reacher.png",
  "Mirror Monster": "assets/monsters/mirrormonster.png",
  "Dragon": "assets/monsters/dragon.png"
};

// Keep the loading-screen logo repository-relative so it works on GitHub Pages.
(function fixLoadingLogo(){
  function apply(){
    const logo=document.getElementById('heroSelectLogo');
    if(!logo)return false;
    logo.style.display='';
    logo.style.visibility='visible';
    logo.style.opacity='1';
    logo.src=new URL('assets/ui/bod3d-logo.png?v=11.23-logo-fix',document.baseURI).href;
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
})();

// v11.23: show the current version consistently wherever the UI exposes it.
(function syncVersion(){
  const version='v11.23';
  function apply(){
    document.title='Bag of Dungeon 3D '+version;
    ['bodVersionUnderLogo','topLogoVersion'].forEach(id=>{
      const el=document.getElementById(id);
      if(el)el.textContent=version;
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
  else apply();
  setTimeout(apply,1000);
})();

// v11.23: mute only dungeon-sounds.mp3. Other sounds are untouched.
(function installDungeonAmbienceToggle(){
  let muted=false;

  if(!HTMLMediaElement.prototype.__bodDungeonMutePatched){
    const originalPlay=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(){
      const src=String(this.currentSrc||this.src||'');
      if(window.__BOD_DUNGEON_AMBIENCE_MUTED__ && /(?:^|\/)dungeon-sounds\.mp3(?:\?|$)/i.test(src)){
        try{this.pause();}catch(_){ }
        return Promise.resolve();
      }
      return originalPlay.apply(this,arguments);
    };
    HTMLMediaElement.prototype.__bodDungeonMutePatched=true;
  }

  function updateButton(button){
    button.textContent=muted?'🔇':'🔊';
    button.title=muted?'Dungeon ambience off — click to turn on':'Dungeon ambience on — click to turn off';
    button.setAttribute('aria-label',button.title);
    button.setAttribute('aria-pressed',muted?'true':'false');
  }

  function install(){
    if(document.getElementById('dungeonSoundToggle'))return true;
    const fullscreen=document.getElementById('fullscreenBtn');
    if(!fullscreen||!fullscreen.parentNode)return false;

    const style=document.createElement('style');
    style.id='dungeonSoundToggleStyles';
    style.textContent=`
      #dungeonSoundToggle{position:absolute;top:10px;right:50px;z-index:66;width:34px;height:34px;padding:0;display:flex;align-items:center;justify-content:center;border:2px solid var(--ink);border-radius:5px;background:var(--cream);color:var(--ink);box-shadow:2px 2px 0 #000;font:700 18px/1 Arial,sans-serif;pointer-events:auto;cursor:pointer}
      #dungeonSoundToggle:hover{background:#fff1c9}
      #topbar{right:92px!important}
    `;
    document.head.appendChild(style);

    const button=document.createElement('button');
    button.id='dungeonSoundToggle';
    button.type='button';
    updateButton(button);
    button.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      muted=!muted;
      window.__BOD_DUNGEON_AMBIENCE_MUTED__=muted;
      if(muted){
        window.stopDungeonAmbience?.();
      }else{
        window.startDungeonAmbience?.();
      }
      updateButton(button);
    });
    fullscreen.insertAdjacentElement('beforebegin',button);
    return true;
  }

  function start(){
    window.__BOD_DUNGEON_AMBIENCE_MUTED__=false;
    if(!install()){
      let tries=0;
      const timer=setInterval(()=>{if(install()||++tries>=100)clearInterval(timer);},50);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();

// Live fallback: retry after other startup scripts in case an older resolver hid the image.
setTimeout(()=>{
  const logo=document.getElementById('heroSelectLogo');
  if(!logo)return;
  logo.style.setProperty('display','block','important');
  logo.style.setProperty('visibility','visible','important');
  logo.style.setProperty('opacity','1','important');
  logo.src=new URL('assets/ui/bod3d-logo.png?v=11.23-logo-fix-2',document.baseURI).href;
},1200);
