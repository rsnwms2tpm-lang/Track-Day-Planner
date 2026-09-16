(() => {
  const API='https://uehmbzwnbariqebbxcst.supabase.co/functions/v1/track-day-api';
  const COMBE_ID='Motorsport Events-2026-09-28-castle-combe';
  const COMBE={id:COMBE_ID,provider:'Motorsport Events',track:'Castle Combe',date:'2026-09-28',format:'Open pit lane'};
  let running=false;

  const readSession=()=>{
    try{return JSON.parse(localStorage.getItem('tdp-session')||'null')}catch{return null}
  };

  async function hydrate(){
    if(running)return;
    const saved=readSession();
    if(!saved?.groupId||!saved?.memberToken)return;
    running=true;
    try{
      const u=new URL(API);
      u.searchParams.set('action','group');
      u.searchParams.set('groupId',saved.groupId);
      u.searchParams.set('token',saved.memberToken);
      const r=await fetch(u.toString(),{cache:'no-store'});
      if(!r.ok)return;
      const groupState=await r.json();
      if(!groupState?.me)return;

      // app.js keeps these as top-level lexical bindings. This script is a
      // classic script too, so update the real app state rather than a copy.
      try{session=saved}catch(_){}
      try{state=groupState}catch(_){}
      try{
        myAvailability={};
        (groupState.availability||[])
          .filter(a=>a.member_id===groupState.me.id)
          .forEach(a=>myAvailability[String(a.date).slice(0,10)]=a.status);
      }catch(_){}

      // A confirmed trip must remain renderable after it disappears from the
      // provider feed. Restore only the event shell; all crew/trip data still
      // comes from Supabase.
      if(groupState.confirmedEventId){
        try{
          if(Array.isArray(events)&&!events.some(e=>e?.id===groupState.confirmedEventId)){
            if(groupState.confirmedEventId===COMBE_ID) events.unshift({...COMBE});
          }
        }catch(_){}
      }

      try{if(typeof render==='function')render()}catch(e){console.error('Confirmed trip render failed',e)}
      try{if(typeof renderTrip==='function')renderTrip()}catch(_){}

      // booking-controller installs the crew-facing Trip shell during render.
      // If another late controller rendered Planning over it, run once more.
      setTimeout(()=>{
        try{if(groupState.confirmedEventId&&typeof render==='function')render()}catch(_){}
      },100);
    }catch(e){console.error('Confirmed trip hydration failed',e)}
    finally{running=false}
  }

  // Run after all controllers are installed, and again after a reconnect saves
  // fresh credentials without requiring another app restart.
  setTimeout(hydrate,0);
  setTimeout(hydrate,400);
  setTimeout(hydrate,1200);
  window.addEventListener('focus',hydrate);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)hydrate()});

  const originalSetItem=Storage.prototype.setItem;
  Storage.prototype.setItem=function(key,value){
    originalSetItem.call(this,key,value);
    if(this===localStorage&&key==='tdp-session')setTimeout(hydrate,0);
  };
})();