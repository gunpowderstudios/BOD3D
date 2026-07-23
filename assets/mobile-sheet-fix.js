// BOD3D-TEST v11.41 — mobile character drawer scroll/close behaviour
(function(){
  function install(){
    const sheet=document.getElementById('side');
    const toggle=document.getElementById('mobileSheetToggle');
    if(!sheet||!toggle)return false;
    if(sheet.dataset.buttonCloseOnly==='1')return true;
    sheet.dataset.buttonCloseOnly='1';

    // Let the drawer content use native momentum scrolling without the legacy
    // swipe-to-close gesture seeing the same touch/pointer events.
    const insideToggle=target=>!!target?.closest?.('#mobileSheetToggle');
    const stopDismissGesture=event=>{
      if(insideToggle(event.target))return;
      if(!sheet.classList.contains('mobileExpanded'))return;
      event.stopPropagation();
    };

    ['touchstart','touchmove','touchend','touchcancel'].forEach(type=>{
      sheet.addEventListener(type,stopDismissGesture,{capture:true,passive:true});
    });
    ['pointerdown','pointermove','pointerup','pointercancel'].forEach(type=>{
      sheet.addEventListener(type,event=>{
        if(event.pointerType==='touch')stopDismissGesture(event);
      },{capture:true,passive:true});
    });

    // Make the existing toggle the explicit open/close control and keep its
    // label clear. Do not close the panel when its contents or backdrop are tapped.
    const syncLabel=()=>{
      const expanded=sheet.classList.contains('mobileExpanded');
      toggle.setAttribute('aria-expanded',expanded?'true':'false');
      toggle.setAttribute('aria-label',expanded?'Close character menu':'Open character menu');
      toggle.title=expanded?'Close character menu':'Open character menu';
    };
    new MutationObserver(syncLabel).observe(sheet,{attributes:true,attributeFilter:['class']});
    syncLabel();

    const style=document.createElement('style');
    style.id='bodMobileSheetButtonOnlyStyles';
    style.textContent=`
      @media(max-width:800px){
        #side{
          overflow-y:auto!important;
          overflow-x:hidden!important;
          -webkit-overflow-scrolling:touch!important;
          overscroll-behavior:contain!important;
          touch-action:pan-y!important;
          scroll-behavior:smooth;
        }
        #side.mobileExpanded{max-height:82dvh!important;}
        #side #mobileSheetToggle{
          position:sticky!important;
          top:0!important;
          z-index:30!important;
          touch-action:manipulation!important;
        }
        #side.mobileExpanded #mobileSheetToggle::after{
          content:'  Close';
          font-size:13px;
        }
      }
    `;
    document.head.appendChild(style);
    return true;
  }

  function start(){
    if(install())return;
    let tries=0;
    const timer=setInterval(()=>{if(install()||++tries>200)clearInterval(timer);},50);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
