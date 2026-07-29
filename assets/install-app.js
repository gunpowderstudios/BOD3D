// BOD3D v12.25 — safe install/Add to Home Screen helper (no offline cache)
(function(){
 'use strict';
 let deferredPrompt=null;
 const standalone=()=>window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true;
 const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(/macintosh/i.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
 function instructions(){
  if(isIOS())return '<b>iPhone or iPad:</b> tap the Share button, then choose <b>Add to Home Screen</b>.';
  if(/macintosh|mac os x/i.test(navigator.userAgent)&&/safari/i.test(navigator.userAgent)&&!/chrome|chromium/i.test(navigator.userAgent))return '<b>Safari on Mac:</b> open the File menu and choose <b>Add to Dock</b>.';
  return 'Open your browser menu and choose <b>Install app</b> or <b>Add to Home screen</b>.';
 }
 function closeHelp(){document.getElementById('bodInstallHelp')?.classList.remove('open');}
 function showHelp(){
  const copy=document.getElementById('bodInstallHelpCopy');
  if(copy)copy.innerHTML=instructions();
  document.getElementById('bodInstallHelp')?.classList.add('open');
 }
 async function install(){
  if(deferredPrompt){
   const prompt=deferredPrompt;
   deferredPrompt=null;
   await prompt.prompt();
   const result=await prompt.userChoice;
   if(result?.outcome==='accepted')document.getElementById('bodInstallButton')?.remove();
   return;
  }
  showHelp();
 }
 function buildUI(){
  if(standalone()||document.getElementById('bodInstallButton'))return;
  const enter=document.getElementById('chooseHeroBtn');
  if(!enter)return;
  const button=document.createElement('button');
  button.type='button';
  button.id='bodInstallButton';
  button.textContent='Install BOD3D App';
  button.addEventListener('click',install);
  enter.insertAdjacentElement('afterend',button);

  const help=document.createElement('div');
  help.id='bodInstallHelp';
  help.setAttribute('aria-hidden','false');
  help.innerHTML='<div class="bodInstallCard" role="dialog" aria-modal="true" aria-labelledby="bodInstallTitle"><h2 id="bodInstallTitle">Add BOD3D to your device</h2><p id="bodInstallHelpCopy"></p><p>It will open from your Home Screen or desktop like an app.</p><button type="button" id="bodInstallClose">Close</button></div>';
  help.addEventListener('click',event=>{if(event.target===help)closeHelp();});
  document.body.appendChild(help);
  document.getElementById('bodInstallClose')?.addEventListener('click',closeHelp);
 }
 window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  deferredPrompt=event;
  buildUI();
 });
 window.addEventListener('appinstalled',()=>{
  deferredPrompt=null;
  document.getElementById('bodInstallButton')?.remove();
  closeHelp();
 });
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',buildUI,{once:true});
 else buildUI();
})();
