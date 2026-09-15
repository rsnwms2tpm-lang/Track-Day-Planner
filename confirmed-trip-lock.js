(() => {
  const COMBE_ID='Motorsport Events-2026-09-28-castle-combe';
  const COMBE={id:COMBE_ID,provider:'Motorsport Events',track:'Castle Combe',date:'2026-09-28'};
  let hydrationRetry=false;

  const hasSession=()=>{try{return !!(session?.groupId&&session?.memberToken)}catch(_){return false}};
  const hasGroup=()=>{try{return !!state?.me}catch(_){return false}};
  const confirmedId=()=>{try{return typeof state!=='undefined'?state?.confirmedEventId:null}catch(_){return null}};

  const ensureConfirmedEvent=()=>{
    const id=confirmedId();
    if(!id)return false;
    try{
      if(typeof events==='undefined'||!Array.isArray(events))return false;
      if(!events.some(e=>e?.id===id)){
        if(id===COMBE_ID)events.unshift({...COMBE});
        else{
          const m=String(id).match(/^(.+)-(\d{4}-\d{2}-\d{2})-(.+)$/);
          if(m)events.unshift({id,provider:m[1],date:m[2],track:m[3].split('-').map(x=>x?x[0].toUpperCase()+x.slice(1):x).join(' ')});
        }
      }
      return events.some(e=>e?.id===id);
    }catch(_){return false}
  };

  const apply=()=>{
    if(!confirmedId())return;
    const available=ensureConfirmedEvent();
    if(available&&!document.querySelector('.trip-mode-shell')){
      try{if(typeof render==='function')render()}catch(_){}
      try{if(typeof renderTrip==='function')renderTrip()}catch(_){}
    }
    const shell=document.querySelector('.trip-mode-shell');
    if(!shell)return;
    document.body.classList.remove('planning-archive-mode');
    const p=document.querySelector('#planningV2');
    if(p)p.style.setProperty('display','none','important');
    document.querySelectorAll('[data-view-planning],[data-planning-back]').forEach(el=>el.remove());
  };

  // app.js starts loading the saved group before the later controller scripts
  // have finished installing. If that first hydration fails/races, the page is
  // left looking exactly like a fresh 0% planner. Retry once after all scripts
  // are installed, preserving the existing saved member credentials.
  const hydrate=async()=>{
    if(hydrationRetry||hasGroup()||!hasSession())return;
    hydrationRetry=true;
    try{if(typeof loadGroup==='function')await loadGroup()}catch(e){console.error('Saved group recovery failed',e)}
    apply();
  };

  const observer=new MutationObserver(apply);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('focus',()=>{if(!hasGroup())hydrationRetry=false,hydrate();else apply()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(!hasGroup())hydrationRetry=false,hydrate();else apply()}});
  setTimeout(hydrate,350);
  setTimeout(()=>{if(!hasGroup()){hydrationRetry=false;hydrate()}else apply()},1800);
})();