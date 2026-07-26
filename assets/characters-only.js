// BOD3D-TEST v11.60 — only Sirrus and Tamara are selectable
(function(){
  function install(){
    if(window.__bodCharactersOnlyInstalled)return true;
    if(typeof CHARACTERS==='undefined'||typeof renderCharSelect!=='function')return false;

    const allowed=new Set(['sirrus','tamara']);
    const fighters=CHARACTERS.filter(character=>allowed.has(character.id));
    if(fighters.length!==2)return false;

    CHARACTERS.splice(0,CHARACTERS.length,...fighters);
    if(typeof selectedCharacterIndex!=='undefined')selectedCharacterIndex=Math.min(selectedCharacterIndex,CHARACTERS.length-1);
    window.__bodCharactersOnlyInstalled=true;
    renderCharSelect();
    return true;
  }

  function start(){
    if(install())return;
    let attempts=0;
    const timer=setInterval(()=>{
      if(install()||++attempts>240)clearInterval(timer);
    },50);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
