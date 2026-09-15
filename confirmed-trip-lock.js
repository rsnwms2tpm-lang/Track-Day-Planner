(() => {
  // A confirmed trip must not depend on the current live provider feed. Once an
  // event is confirmed it can later disappear from search (sold out/past/feed
  // changes), but Trip/Stay/Bingo still need the event object to render.
  const COMBE_ID='Motorsport Events-2026-09-28-castle-combe';
  const COMBE={id:COMBE_ID,provider:'Motorsport Events',track:'Castle Combe',date:'2026-09-28'};

  const confirmedId=()=>{
    try{return typeof state!=='undefined'?state?.confirmedEventId:null}catch(_){return null}
  };

  const ensureConfirmedEvent=()=>{
    const id=confirmedId();
    if(!id) return false;
    try{
      if(typeof events==='undefined'||!Array.isArray(events)) return false;
      if(!events.some(e=>e?.id===id)){
        if(id===COMBE_ID) events.unshift({...COMBE});
        else {
          const m=String(id).match(/^(.+)-(\d{4}-\d{2}-\d{2})-(.+)$/);
          if(m) events.unshift({id,provider:m[1],date:m[2],track:m[3].split('-').map(x=>x?x[0].toUpperCase()+x.slice(1):x).join(' ')});
        }
      }
      return events.some(e=>e?.id===id);
    }catch(_){return false}
  };

  const apply=()=>{
    if(!confirmedId()) return;
    const inserted=ensureConfirmedEvent();

    // If we had to restore the confirmed event after the normal render pass,
    // trigger that pass again so booking-controller can build Trip Home.
    if(inserted && !document.querySelector('.trip-mode-shell')){
      try{if(typeof render==='function') render()}catch(_){}
    }

    const shell=document.querySelector('.trip-mode-shell');
    if(!shell) return;
    document.body.classList.remove('planning-archive-mode');
    const p=document.querySelector('#planningV2');
    if(p) p.style.setProperty('display','none','important');
    document.querySelectorAll('[data-view-planning],[data-planning-back]').forEach(el=>el.remove());
  };

  const observer=new MutationObserver(apply);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('focus',apply);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply()});
  setTimeout(apply,0);
  setTimeout(apply,500);
  setTimeout(apply,1500);
})();