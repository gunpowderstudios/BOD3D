// Bag of Dungeon 3D — unified background music, ambience and audio controls
// Gameplay sound effects remain in game.js.

(function(){
  'use strict';

  const MUSIC_VOLUME_KEY='bod3dMusicVolume';
  const DUNGEON_VOLUME_KEY='bod3dDungeonVolume';
  const EFFECTS_VOLUME_KEY='bod3dEffectsVolume';

  function savedLevel(key,fallback){try{const value=localStorage.getItem(key);if(value===null)return fallback;return Math.max(0,Math.min(1,Number(value)));}catch(_){return fallback;}}
  let musicVolume=savedLevel(MUSIC_VOLUME_KEY,0.10);
  let dungeonVolume=savedLevel(DUNGEON_VOLUME_KEY,0);
  let effectsVolume=savedLevel(EFFECTS_VOLUME_KEY,(()=>{try{return localStorage.getItem('bod3dEffectsEnabled')==='false'?0:0.30}catch(_){return 0.30}})());
  window.__BOD_MASTER_MUTED__=false;window.__BOD_MUSIC_ENABLED__=musicVolume>0;window.__BOD_MUSIC_VOLUME__=musicVolume;window.__BOD_DUNGEON_VOLUME__=dungeonVolume;window.__BOD_EFFECTS_ENABLED__=effectsVolume>0;window.__BOD_EFFECTS_VOLUME__=effectsVolume;

  const START_AMBIENCE_PATH='./assets/sounds/distant-monsters.mp3',START_AMBIENCE_VOLUME=0.22,DUNGEON_AMBIENCE_PATH='./assets/sounds/dungeon-sounds.mp3',RADIO_TRACK_KEY='bod3dRadioTrack';
  const RADIO_CANDIDATES=[
    {number:1,file:'./assets/radio/01-welcome-to-the-dungeon.mp3',title:'Welcome to the Dungeon',artist:'',artistUrl:'',licence:'',licenceUrl:''},
    {number:2,file:'./assets/radio/02-burn-the-world-waltz.mp3',title:'Burn The World Waltz',artist:'Kevin MacLeod',artistUrl:'https://incompetech.com/',licence:'Creative Commons Attribution 4.0',licenceUrl:'https://creativecommons.org/licenses/by/4.0/'},
    {number:3,file:'./assets/radio/03-gearhead.mp3',title:'Gearhead',artist:'Kevin MacLeod',artistUrl:'https://incompetech.com/',licence:'Creative Commons Attribution 4.0',licenceUrl:'https://creativecommons.org/licenses/by/4.0/'},
    {number:4,file:'./assets/radio/04-exhilarate.mp3',title:'Exhilarate',artist:'Kevin MacLeod',artistUrl:'https://incompetech.com/',licence:'Creative Commons Attribution 4.0',licenceUrl:'https://creativecommons.org/licenses/by/4.0/'}
  ];
  const END_MUSIC_PATH='./assets/sounds/end-game-music.mp3';
  let distantAudio=null,rockAudio=null,dungeonAudio=null,endAudio=null,availableRadioTracks=[RADIO_CANDIDATES[0]],radioDiscoveryPromise=null,rockIndex=0,radioPaused=false,radioListOpen=false,dungeonWanted=false,endingActive=false,pageActive=!document.hidden;

  function startScreenVisible(){const element=document.getElementById('charSelect');if(!element)return false;const style=getComputedStyle(element);return !element.hidden&&style.display!=='none'&&style.visibility!=='hidden'&&style.opacity!=='0'&&element.getClientRects().length>0;}
  function ensureDistant(){if(!distantAudio){distantAudio=new Audio(START_AMBIENCE_PATH);distantAudio.loop=true;distantAudio.preload='auto';}distantAudio.volume=START_AMBIENCE_VOLUME;return distantAudio;}
  function startDistantMonstersAmbience(){if(!pageActive||document.hidden||endingActive)return;stopDungeonAmbience();ensureDistant().play().catch(()=>{});}
  function stopDistantMonstersAmbience(){if(!distantAudio)return;distantAudio.pause();distantAudio.currentTime=0;}
  function currentRadioTrack(){return availableRadioTracks[rockIndex]||availableRadioTracks[0]||null;}
  function rememberRadioTrack(){const track=currentRadioTrack();if(!track)return;try{localStorage.setItem(RADIO_TRACK_KEY,track.file);}catch(_){}}
  async function discoverRadioTracks(force=false){if(radioDiscoveryPromise&&!force)return radioDiscoveryPromise;radioDiscoveryPromise=Promise.all(RADIO_CANDIDATES.map(async track=>{try{const response=await fetch(track.file+'?radio-check=13.19',{method:'HEAD',cache:'no-store'});return response.ok?track:null;}catch(_){return null;}})).then(results=>{const found=results.filter(Boolean);if(found.length)availableRadioTracks=found;let preferred='';try{preferred=localStorage.getItem(RADIO_TRACK_KEY)||'';}catch(_){}const activeFile=rockAudio?String(rockAudio.src||'').split(location.origin).pop():'';const preferredIndex=availableRadioTracks.findIndex(track=>track.file===preferred||activeFile.endsWith(track.file.replace('./','/')));rockIndex=preferredIndex>=0?preferredIndex:Math.min(rockIndex,availableRadioTracks.length-1);refreshRadioPanel();return availableRadioTracks;});return radioDiscoveryPromise;}
  function loadRadioTrack(index,play=true){if(!availableRadioTracks.length)return;rockIndex=(index+availableRadioTracks.length)%availableRadioTracks.length;const track=currentRadioTrack();if(!track)return;const player=ensureRock();player.pause();player.src=track.file;player.currentTime=0;player.volume=musicVolume;rememberRadioTrack();if(play&&dungeonWanted&&musicVolume>0&&!radioPaused&&pageActive&&!document.hidden&&!endingActive)player.play().catch(()=>{});refreshRadioPanel();}
  function ensureRock(){const track=currentRadioTrack();if(!track)return null;if(!rockAudio){rockAudio=new Audio(track.file);rockAudio.loop=false;rockAudio.preload='auto';rockAudio.addEventListener('ended',()=>{if(radioPaused)return;loadRadioTrack(rockIndex+1,true);});}rockAudio.volume=musicVolume;return rockAudio;}
  function ensureDungeonSound(){if(!dungeonAudio){dungeonAudio=new Audio(DUNGEON_AMBIENCE_PATH);dungeonAudio.loop=true;dungeonAudio.preload='auto';}dungeonAudio.volume=dungeonVolume;return dungeonAudio;}
  function startDungeonAmbience(){dungeonWanted=true;stopDistantMonstersAmbience();if(!pageActive||document.hidden||endingActive)return;if(musicVolume>0&&!radioPaused)ensureRock()?.play().catch(()=>{});if(dungeonVolume>0)ensureDungeonSound().play().catch(()=>{});}
  function stopDungeonAmbience(){dungeonWanted=false;[rockAudio,dungeonAudio].forEach(player=>{if(!player)return;player.pause();player.currentTime=0;});}
  function pauseDungeonLayers(){[rockAudio,dungeonAudio].forEach(player=>player?.pause());}
  function applyBackgroundVolumes(){if(rockAudio)rockAudio.volume=musicVolume;if(dungeonAudio)dungeonAudio.volume=dungeonVolume;if(distantAudio)distantAudio.volume=START_AMBIENCE_VOLUME;if(endAudio)endAudio.volume=musicVolume;if(endingActive){if(musicVolume>0&&pageActive&&!document.hidden)ensureEndMusic().play().catch(()=>{});else endAudio?.pause();return;}if(startScreenVisible()){startDistantMonstersAmbience();return;}if(dungeonWanted){if(musicVolume>0&&!radioPaused)ensureRock()?.play().catch(()=>{});else rockAudio?.pause();if(dungeonVolume>0)ensureDungeonSound().play().catch(()=>{});else dungeonAudio?.pause();}}
  function ensureEndMusic(){if(!endAudio){endAudio=new Audio(END_MUSIC_PATH);endAudio.loop=true;endAudio.preload='auto';}endAudio.volume=musicVolume;return endAudio;}
  function startEndGameMusic(){endingActive=true;pauseDungeonLayers();stopDistantMonstersAmbience();if(musicVolume>0&&pageActive&&!document.hidden){const player=ensureEndMusic();player.currentTime=0;player.play().catch(()=>{});}}
  function stopEndGameMusic(){endingActive=false;if(endAudio){endAudio.pause();endAudio.currentTime=0;}}
  function saveLevel(key,value){try{localStorage.setItem(key,String(value));}catch(_){}}
  function labelLevel(id,value){const label=document.getElementById(id);if(label)label.textContent=value>0?Math.round(value*100)+'%':'OFF';}
  function setMusicVolume(value){musicVolume=Math.max(0,Math.min(1,Number(value)/100));window.__BOD_MUSIC_ENABLED__=musicVolume>0;window.__BOD_MUSIC_VOLUME__=musicVolume;saveLevel(MUSIC_VOLUME_KEY,musicVolume);labelLevel('musicVolumeValue',musicVolume);applyBackgroundVolumes();updateSoundButton();}
  function setDungeonVolume(value){dungeonVolume=Math.max(0,Math.min(1,Number(value)/100));window.__BOD_DUNGEON_VOLUME__=dungeonVolume;saveLevel(DUNGEON_VOLUME_KEY,dungeonVolume);labelLevel('dungeonVolumeValue',dungeonVolume);applyBackgroundVolumes();updateSoundButton();}
  function setEffectsVolume(value){effectsVolume=Math.max(0,Math.min(1,Number(value)/100));window.__BOD_EFFECTS_ENABLED__=effectsVolume>0;window.__BOD_EFFECTS_VOLUME__=effectsVolume;saveLevel(EFFECTS_VOLUME_KEY,effectsVolume);try{localStorage.setItem('bodDigitalSoundVolume',String(effectsVolume));localStorage.setItem('bodDigitalSoundOn',String(effectsVolume>0));localStorage.setItem('bod3dEffectsEnabled',String(effectsVolume>0));}catch(_){}labelLevel('effectsVolumeValue',effectsVolume);updateSoundButton();}
  window.BODSetMusicVolume=setMusicVolume;window.BODSetDungeonVolume=setDungeonVolume;window.BODSetEffectsVolume=setEffectsVolume;window.startDistantMonstersAmbience=startDistantMonstersAmbience;window.stopDistantMonstersAmbience=stopDistantMonstersAmbience;window.startDungeonAmbience=startDungeonAmbience;window.stopDungeonAmbience=stopDungeonAmbience;window.ensureDungeonAmbience=()=>{if(dungeonWanted)startDungeonAmbience()};window.startEndGameMusic=startEndGameMusic;window.stopEndGameMusic=stopEndGameMusic;window.BODApplyBackgroundVolumes=applyBackgroundVolumes;
  function radioPrevious(){loadRadioTrack(rockIndex-1,true);}function radioNext(){loadRadioTrack(rockIndex+1,true);}function radioTogglePlay(){radioPaused=!radioPaused;if(radioPaused)rockAudio?.pause();else if(dungeonWanted&&musicVolume>0&&!endingActive)ensureRock()?.play().catch(()=>{});refreshRadioPanel();}function radioSelect(index){radioPaused=false;loadRadioTrack(Number(index),true);}function radioToggleList(){radioListOpen=!radioListOpen;refreshRadioPanel();}
  window.BODRadioPrevious=radioPrevious;window.BODRadioNext=radioNext;window.BODRadioTogglePlay=radioTogglePlay;window.BODRadioSelect=radioSelect;window.BODRadioToggleList=radioToggleList;

  function installDesktopLayoutStyles(){
    if(document.getElementById('bodDesktopLayoutStyles'))return;
    const style=document.createElement('style');
    style.id='bodDesktopLayoutStyles';
    style.textContent=`
      @media (min-width:901px){
        #charSelect .heroSelectContent{
          width:100%!important;
          left:0!important;
          right:0!important;
          justify-items:center!important;
          align-items:center!important;
          grid-template-rows:minmax(300px,1fr) auto!important;
          padding:12px clamp(12px,3vw,48px) 18px!important;
        }
        #charSelect .heroStage{
          justify-self:center!important;
          margin:0 auto!important;
        }
        #charSelect .heroInfoPanel{
          position:relative!important;
          left:auto!important;
          right:auto!important;
          transform:none!important;
          justify-self:center!important;
          display:flex!important;
          flex-direction:column!important;
          align-items:center!important;
          width:min(680px,82vw)!important;
          margin:-12px auto 0!important;
          padding:8px 28px 12px!important;
          text-align:center!important;
        }
        #charSelect .heroInfoPanel h1{order:1!important;width:100%!important;margin:0!important;text-align:center!important}
        #charSelect .selectedHeroDesc{order:2!important;width:100%!important;text-align:center!important;margin:2px 0 7px!important}
        #charSelect .heroStatRow{order:3!important;width:100%!important;grid-template-columns:repeat(3,1fr)!important;margin:0 auto 7px!important;text-align:center!important}
        #charSelect .heroSpecialBlock{order:4!important;width:100%!important;display:flex!important;flex-direction:column!important;align-items:center!important;text-align:center!important;margin:2px 0 8px!important}
        #charSelect .heroDots{order:5!important;position:static!important;left:auto!important;top:auto!important;transform:none!important;margin:2px auto 8px!important;justify-content:center!important}
        #charSelect #chooseHeroBtn{
          order:6!important;
          position:static!important;
          left:auto!important;
          right:auto!important;
          top:auto!important;
          bottom:auto!important;
          transform:none!important;
          width:min(420px,72%)!important;
          min-height:54px!important;
          margin:0 auto!important;
          padding:10px 24px!important;
          background:#050505!important;
          color:#fff!important;
          -webkit-text-fill-color:#fff!important;
          border:2px solid #fff!important;
          border-radius:2px!important;
          box-shadow:0 4px 12px rgba(0,0,0,.72)!important;
          font-size:19px!important;
          z-index:auto!important;
        }
        #charSelect #chooseHeroBtn:hover:not(:disabled),#charSelect #chooseHeroBtn:focus:not(:disabled){
          background:#a71924!important;
          color:#fff!important;
          -webkit-text-fill-color:#fff!important;
          transform:none!important;
        }
      }
      #desktopDungeonRadio{display:none!important}
    `;
    document.head.appendChild(style);
    document.getElementById('desktopDungeonRadio')?.remove();
  }

  function radioPanelHTML(){
    const track=currentRadioTrack();
    const list=availableRadioTracks.map((item,index)=>{const artist=item.artist?' <span class="radioTrackArtist">— '+item.artist+'</span>':'';return '<button type="button" class="radioTrackButton '+(index===rockIndex?'active':'')+'" onclick="BODRadioSelect('+index+')"><span>'+item.title+'</span>'+artist+'</button>';}).join('');
    const artistLine=track&&track.artist?'<div class="radioArtist">by <a href="'+track.artistUrl+'" target="_blank" rel="noopener noreferrer">'+track.artist+'</a></div>':'';
    const licenceLine=track&&track.licence?'<div class="radioLicence"><a href="'+track.licenceUrl+'" target="_blank" rel="license noopener noreferrer">'+track.licence+'</a></div>':'';
    return '<section class="dungeonRadio" aria-label="Dungeon Radio">'+
      '<div class="dungeonRadioTitle">DUNGEON RADIO</div>'+
      '<div class="radioNowPlaying"><span>Now playing</span><b>'+(track?track.title:'No tracks uploaded')+'</b></div>'+artistLine+licenceLine+
      '<div class="radioTransport"><button type="button" onclick="BODRadioPrevious()" aria-label="Previous track">◀</button><button type="button" onclick="BODRadioTogglePlay()">'+(radioPaused?'PLAY':'PAUSE')+'</button><button type="button" onclick="BODRadioNext()" aria-label="Next track">▶</button></div>'+
      '<button type="button" class="radioChoose" onclick="BODRadioToggleList()">Choose Track ('+availableRadioTracks.length+') '+(radioListOpen?'▲':'▼')+'</button>'+
      '<div class="radioTrackList '+(radioListOpen?'open':'')+'">'+list+'</div>'+
      '<div class="radioJoin" style="margin-top:18px;padding-top:14px;border-top:1px solid #555;text-align:center;font-size:13px;line-height:1.35;opacity:.82">'+
       '<div style="color:#E9BB00;font-size:14px;font-weight:900;letter-spacing:.06em;margin-bottom:6px">JOIN DUNGEON RADIO</div>'+
       '<div style="font-weight:800;margin-bottom:5px">Got a rock track you’d like featured on Dungeon Radio?</div>'+
       '<div>We’re looking for progressive rock that fits the style and atmosphere of the tracks already playing. Let us use it in the game and we’ll link back to you and your music! We can’t feature everything we receive, but we’d love to hear yours.</div>'+
       '<div style="margin-top:7px"><b>Send us your track: <a href="mailto:info@gunpowderstudios.co.uk">info@gunpowderstudios.co.uk</a></b></div>'+
      '</div>'+
     '</section>';
  }
  function refreshRadioPanel(){const panel=document.getElementById('dungeonRadioMount');if(panel)panel.innerHTML=radioPanelHTML();}
  function sliderRow(id,label,value,handler){const percent=Math.round(value*100);return '<div class="audioMixerRow"><label for="'+id+'"><b>'+label+'</b><span id="'+id.replace('Slider','Value')+'">'+(percent>0?percent+'%':'OFF')+'</span></label><input id="'+id+'" type="range" min="0" max="100" step="1" value="'+percent+'" oninput="'+handler+'(this.value)"><div class="audioMixerScale"><span>OFF</span><span>100%</span></div></div>';}
  function openAudioOptions(){if(typeof window.showModal!=='function')return;window.showModal('SOUND','',[{text:'Close',fn:window.closeModal}]);const body=document.getElementById('modalBody');if(body)body.innerHTML='<div class="audioMixer">'+sliderRow('musicVolumeSlider','Music',musicVolume,'BODSetMusicVolume')+sliderRow('dungeonVolumeSlider','Dungeon sounds',dungeonVolume,'BODSetDungeonVolume')+sliderRow('effectsVolumeSlider','Sound effects',effectsVolume,'BODSetEffectsVolume')+'<p>Move any slider fully left to turn that sound off.</p><div id="dungeonRadioMount">'+radioPanelHTML()+'</div></div>';discoverRadioTracks();}
  function updateSoundButton(){const button=document.getElementById('dungeonSoundToggle');if(!button)return false;const allOff=musicVolume<=0&&dungeonVolume<=0&&effectsVolume<=0;button.innerHTML=allOff?'<svg class="controlIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l4 4m0-4l-4 4"/></svg>':'<svg class="controlIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5c1 .9 1.5 2.1 1.5 3.5S17 14.6 16 15.5"/><path d="M18.5 6c1.7 1.6 2.5 3.6 2.5 6s-.8 4.4-2.5 6"/></svg>';button.title='Sound controls';button.setAttribute('aria-label','Open sound controls');button.setAttribute('aria-pressed','false');return true;}
  function installSoundButton(){document.getElementById('dungeonMusicOptions')?.remove();let button=document.getElementById('dungeonSoundToggle');if(!button){const fullscreen=document.getElementById('fullscreenBtn');button=document.createElement('button');button.id='dungeonSoundToggle';button.type='button';if(fullscreen?.parentNode)fullscreen.insertAdjacentElement('beforebegin',button);else(document.getElementById('main')||document.body).appendChild(button);}button.hidden=false;button.onclick=event=>{event.preventDefault();event.stopPropagation();openAudioOptions();};updateSoundButton();return true;}
  function syncToScreen(){if(endingActive)return;if(startScreenVisible()){stopDungeonAmbience();startDistantMonstersAmbience();}else{stopDistantMonstersAmbience();startDungeonAmbience();}}
  function leavePage(){pageActive=false;distantAudio?.pause();pauseDungeonLayers();endAudio?.pause();}
  function returnToPage(){pageActive=!document.hidden;if(!pageActive)return;setTimeout(()=>{if(endingActive&&musicVolume>0)ensureEndMusic().play().catch(()=>{});else syncToScreen();},80);}
  function start(){installDesktopLayoutStyles();discoverRadioTracks();installSoundButton();const charSelect=document.getElementById('charSelect');if(charSelect)new MutationObserver(syncToScreen).observe(charSelect,{attributes:true,attributeFilter:['class','style','hidden']});syncToScreen();}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)leavePage();else returnToPage();},true);window.addEventListener('pagehide',leavePage,true);window.addEventListener('pageshow',returnToPage,true);window.addEventListener('focus',returnToPage,true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();