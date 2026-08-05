// Bag of Dungeon 3D — unified background music, ambience and audio controls
// Gameplay sound effects remain in game.js.

(function(){
  'use strict';

  const MUSIC_VOLUME_KEY='bod3dMusicVolume';
  const DUNGEON_VOLUME_KEY='bod3dDungeonVolume';
  const EFFECTS_VOLUME_KEY='bod3dEffectsVolume';

  function savedLevel(key,fallback){
    try{
      const value=localStorage.getItem(key);
      if(value===null)return fallback;
      return Math.max(0,Math.min(1,Number(value)));
    }catch(_){return fallback;}
  }

  let musicVolume=savedLevel(MUSIC_VOLUME_KEY,0.10);
  let dungeonVolume=savedLevel(DUNGEON_VOLUME_KEY,0);
  let effectsVolume=savedLevel(
    EFFECTS_VOLUME_KEY,
    (()=>{try{return localStorage.getItem('bod3dEffectsEnabled')==='false'?0:0.30}catch(_){return 0.30}})()
  );

  window.__BOD_MASTER_MUTED__=false;
  window.__BOD_MUSIC_ENABLED__=musicVolume>0;
  window.__BOD_MUSIC_VOLUME__=musicVolume;
  window.__BOD_DUNGEON_VOLUME__=dungeonVolume;
  window.__BOD_EFFECTS_ENABLED__=effectsVolume>0;
  window.__BOD_EFFECTS_VOLUME__=effectsVolume;

  const START_AMBIENCE_PATH='./assets/sounds/distant-monsters.mp3';
  const DUNGEON_AMBIENCE_PATH='./assets/sounds/dungeon-sounds.mp3';
  const DUNGEON_MUSIC_PLAYLIST=['./assets/sounds/rock-track1.mp3'];
  const END_MUSIC_PATH='./assets/sounds/end-game-music.mp3';

  let distantAudio=null;
  let rockAudio=null;
  let dungeonAudio=null;
  let endAudio=null;
  let rockIndex=0;
  let dungeonWanted=false;
  let endingActive=false;
  let pageActive=!document.hidden;

  function startScreenVisible(){
    const element=document.getElementById('charSelect');
    if(!element)return false;
    const style=getComputedStyle(element);
    return !element.hidden&&style.display!=='none'&&style.visibility!=='hidden'&&
      style.opacity!=='0'&&element.getClientRects().length>0;
  }

  function ensureDistant(){
    if(!distantAudio){
      distantAudio=new Audio(START_AMBIENCE_PATH);
      distantAudio.loop=true;
      distantAudio.preload='auto';
    }
    distantAudio.volume=dungeonVolume;
    return distantAudio;
  }

  function startDistantMonstersAmbience(){
    if(!pageActive||document.hidden||endingActive||dungeonVolume<=0)return;
    stopDungeonAmbience();
    ensureDistant().play().catch(()=>{});
  }

  function stopDistantMonstersAmbience(){
    if(!distantAudio)return;
    distantAudio.pause();
    distantAudio.currentTime=0;
  }

  function ensureRock(){
    if(!rockAudio){
      rockAudio=new Audio(DUNGEON_MUSIC_PLAYLIST[rockIndex]);
      rockAudio.loop=false;
      rockAudio.preload='auto';
      rockAudio.addEventListener('ended',()=>{
        rockIndex=(rockIndex+1)%DUNGEON_MUSIC_PLAYLIST.length;
        rockAudio.src=DUNGEON_MUSIC_PLAYLIST[rockIndex];
        rockAudio.volume=musicVolume;
        if(dungeonWanted&&musicVolume>0&&pageActive&&!document.hidden&&!endingActive){
          rockAudio.play().catch(()=>{});
        }
      });
    }
    rockAudio.volume=musicVolume;
    return rockAudio;
  }

  function ensureDungeonSound(){
    if(!dungeonAudio){
      dungeonAudio=new Audio(DUNGEON_AMBIENCE_PATH);
      dungeonAudio.loop=true;
      dungeonAudio.preload='auto';
    }
    dungeonAudio.volume=dungeonVolume;
    return dungeonAudio;
  }

  function startDungeonAmbience(){
    dungeonWanted=true;
    stopDistantMonstersAmbience();
    if(!pageActive||document.hidden||endingActive)return;
    if(musicVolume>0)ensureRock().play().catch(()=>{});
    if(dungeonVolume>0)ensureDungeonSound().play().catch(()=>{});
  }

  function stopDungeonAmbience(){
    dungeonWanted=false;
    [rockAudio,dungeonAudio].forEach(player=>{
      if(!player)return;
      player.pause();
      player.currentTime=0;
    });
  }

  function pauseDungeonLayers(){
    [rockAudio,dungeonAudio].forEach(player=>player?.pause());
  }

  function applyBackgroundVolumes(){
    if(rockAudio)rockAudio.volume=musicVolume;
    if(dungeonAudio)dungeonAudio.volume=dungeonVolume;
    if(distantAudio)distantAudio.volume=dungeonVolume;
    if(endAudio)endAudio.volume=musicVolume;

    if(endingActive){
      if(musicVolume>0&&pageActive&&!document.hidden)ensureEndMusic().play().catch(()=>{});
      else endAudio?.pause();
      return;
    }

    if(startScreenVisible()){
      if(dungeonVolume>0)startDistantMonstersAmbience();
      else stopDistantMonstersAmbience();
      return;
    }

    if(dungeonWanted){
      if(musicVolume>0)ensureRock().play().catch(()=>{});
      else rockAudio?.pause();
      if(dungeonVolume>0)ensureDungeonSound().play().catch(()=>{});
      else dungeonAudio?.pause();
    }
  }

  function ensureEndMusic(){
    if(!endAudio){
      endAudio=new Audio(END_MUSIC_PATH);
      endAudio.loop=true;
      endAudio.preload='auto';
    }
    endAudio.volume=musicVolume;
    return endAudio;
  }

  function startEndGameMusic(){
    endingActive=true;
    pauseDungeonLayers();
    stopDistantMonstersAmbience();
    if(musicVolume>0&&pageActive&&!document.hidden){
      const player=ensureEndMusic();
      player.currentTime=0;
      player.play().catch(()=>{});
    }
  }

  function stopEndGameMusic(){
    endingActive=false;
    if(endAudio){
      endAudio.pause();
      endAudio.currentTime=0;
    }
  }

  function saveLevel(key,value){
    try{localStorage.setItem(key,String(value));}catch(_){}
  }

  function labelLevel(id,value){
    const label=document.getElementById(id);
    if(label)label.textContent=value>0?Math.round(value*100)+'%':'OFF';
  }

  function setMusicVolume(value){
    musicVolume=Math.max(0,Math.min(1,Number(value)/100));
    window.__BOD_MUSIC_ENABLED__=musicVolume>0;
    window.__BOD_MUSIC_VOLUME__=musicVolume;
    saveLevel(MUSIC_VOLUME_KEY,musicVolume);
    labelLevel('musicVolumeValue',musicVolume);
    applyBackgroundVolumes();
    updateSoundButton();
  }

  function setDungeonVolume(value){
    dungeonVolume=Math.max(0,Math.min(1,Number(value)/100));
    window.__BOD_DUNGEON_VOLUME__=dungeonVolume;
    saveLevel(DUNGEON_VOLUME_KEY,dungeonVolume);
    labelLevel('dungeonVolumeValue',dungeonVolume);
    applyBackgroundVolumes();
    updateSoundButton();
  }

  function setEffectsVolume(value){
    effectsVolume=Math.max(0,Math.min(1,Number(value)/100));
    window.__BOD_EFFECTS_ENABLED__=effectsVolume>0;
    window.__BOD_EFFECTS_VOLUME__=effectsVolume;
    saveLevel(EFFECTS_VOLUME_KEY,effectsVolume);
    try{
      localStorage.setItem('bodDigitalSoundVolume',String(effectsVolume));
      localStorage.setItem('bodDigitalSoundOn',String(effectsVolume>0));
      localStorage.setItem('bod3dEffectsEnabled',String(effectsVolume>0));
    }catch(_){}
    labelLevel('effectsVolumeValue',effectsVolume);
    updateSoundButton();
  }

  window.BODSetMusicVolume=setMusicVolume;
  window.BODSetDungeonVolume=setDungeonVolume;
  window.BODSetEffectsVolume=setEffectsVolume;
  window.startDistantMonstersAmbience=startDistantMonstersAmbience;
  window.stopDistantMonstersAmbience=stopDistantMonstersAmbience;
  window.startDungeonAmbience=startDungeonAmbience;
  window.stopDungeonAmbience=stopDungeonAmbience;
  window.ensureDungeonAmbience=()=>{if(dungeonWanted)startDungeonAmbience()};
  window.startEndGameMusic=startEndGameMusic;
  window.stopEndGameMusic=stopEndGameMusic;
  window.BODApplyBackgroundVolumes=applyBackgroundVolumes;

  function sliderRow(id,label,value,handler){
    const percent=Math.round(value*100);
    return '<div class="audioMixerRow">'+
      '<label for="'+id+'"><b>'+label+'</b><span id="'+id.replace('Slider','Value')+'">'+
       (percent>0?percent+'%':'OFF')+
      '</span></label>'+
      '<input id="'+id+'" type="range" min="0" max="100" step="1" value="'+percent+
       '" oninput="'+handler+'(this.value)">'+
      '<div class="audioMixerScale"><span>OFF</span><span>100%</span></div>'+
     '</div>';
  }

  function openAudioOptions(){
    if(typeof window.showModal!=='function')return;
    window.showModal('SOUND','',[
      {text:'Close',fn:window.closeModal}
    ]);
    const body=document.getElementById('modalBody');
    if(body)body.innerHTML='<div class="audioMixer">'+
      sliderRow('musicVolumeSlider','Music',musicVolume,'BODSetMusicVolume')+
      sliderRow('dungeonVolumeSlider','Dungeon sounds',dungeonVolume,'BODSetDungeonVolume')+
      sliderRow('effectsVolumeSlider','Sound effects',effectsVolume,'BODSetEffectsVolume')+
      '<p>Move any slider fully left to turn that sound off.</p>'+
     '</div>';
  }

  function updateSoundButton(){
    const button=document.getElementById('dungeonSoundToggle');
    if(!button)return false;
    const allOff=musicVolume<=0&&dungeonVolume<=0&&effectsVolume<=0;
    button.innerHTML=allOff
      ? '<svg class="controlIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l4 4m0-4l-4 4"/></svg>'
      : '<svg class="controlIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5c1 .9 1.5 2.1 1.5 3.5S17 14.6 16 15.5"/><path d="M18.5 6c1.7 1.6 2.5 3.6 2.5 6s-.8 4.4-2.5 6"/></svg>';
    button.title='Sound controls';
    button.setAttribute('aria-label','Open sound controls');
    button.setAttribute('aria-pressed','false');
    return true;
  }

  function installSoundButton(){
    document.getElementById('dungeonMusicOptions')?.remove();
    let button=document.getElementById('dungeonSoundToggle');
    if(!button){
      const fullscreen=document.getElementById('fullscreenBtn');
      button=document.createElement('button');
      button.id='dungeonSoundToggle';
      button.type='button';
      if(fullscreen?.parentNode)fullscreen.insertAdjacentElement('beforebegin',button);
      else(document.getElementById('main')||document.body).appendChild(button);
    }
    button.hidden=false;
    button.onclick=event=>{
      event.preventDefault();
      event.stopPropagation();
      openAudioOptions();
    };
    updateSoundButton();
    return true;
  }

  function syncToScreen(){
    if(endingActive)return;
    if(startScreenVisible()){
      stopDungeonAmbience();
      if(dungeonVolume>0)startDistantMonstersAmbience();
    }else{
      stopDistantMonstersAmbience();
      startDungeonAmbience();
    }
  }

  function leavePage(){
    pageActive=false;
    distantAudio?.pause();
    pauseDungeonLayers();
    endAudio?.pause();
  }

  function returnToPage(){
    pageActive=!document.hidden;
    if(!pageActive)return;
    setTimeout(()=>{
      if(endingActive&&musicVolume>0)ensureEndMusic().play().catch(()=>{});
      else syncToScreen();
    },80);
  }

  function start(){
    installSoundButton();
    const charSelect=document.getElementById('charSelect');
    if(charSelect){
      new MutationObserver(syncToScreen).observe(charSelect,{
        attributes:true,
        attributeFilter:['class','style','hidden']
      });
    }
    syncToScreen();
  }

  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)leavePage();
    else returnToPage();
  },true);
  window.addEventListener('pagehide',leavePage,true);
  window.addEventListener('pageshow',returnToPage,true);
  window.addEventListener('focus',returnToPage,true);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
