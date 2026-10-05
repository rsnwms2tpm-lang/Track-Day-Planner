(()=>{
  const API='https://uehmbzwnbariqebbxcst.supabase.co/functions/v1/trip-track-day';
  // app.js keeps state/session as top-level lexical bindings. Read those directly;
  // do not use window.state. Also do not treat the initial empty state as a
  // completed event while the saved group is still loading.
  const appState=()=>{try{return typeof state!=='undefined'?state:null}catch{return null}};
  const appSession=()=>{try{return typeof session!=='undefined'?session:(window.session||null)}catch{return window.session||null}};
  const ready=()=>{const s=appState(),x=appSession();return !!(s?.me&&x?.groupId&&x?.memberToken)};
  const completed=()=>{const s=appState();return ready()&&!s.confirmedEventId};
  const creds=()=>{const s=appSession();return s?.groupId&&s?.memberToken?{groupId:s.groupId,token:s.memberToken}:null};
  function hideTripShell(){document.querySelectorAll('.trip-mode-shell').forEach(n=>n.style.setProperty('display','none','important'));document.body.classList.remove('trip-mode')}
  function clearNoTrip(){document.getElementById('tdhNoActiveTrip')?.remove()}
  function showPlan(){if(!ready())return;clearNoTrip();window.TDHMasterHome?.close?.();window.TDHPreEvent?.close?.();window.TDHResultsHome?.close?.();window.TDHTrackDayMode?.suspend?.();hideTripShell();const p=document.querySelector('#planningV2');if(p)p.style.removeProperty('display');window.TDHGlobalNav?.refresh?.()}
  function noActiveTrip(title,copy){window.TDHMasterHome?.close?.();window.TDHPreEvent?.close?.();window.TDHResultsHome?.close?.();window.TDHTrackDayMode?.suspend?.();hideTripShell();document.querySelector('#planningV2')?.style.setProperty('display','none','important');let r=document.getElementById('tdhNoActiveTrip');if(!r){r=document.createElement('div');r.id='tdhNoActiveTrip';r.style='position:fixed;inset:0;z-index:100100;overflow:auto;background:#080a0d;color:#eef5f0;font-family:system-ui,-apple-system,sans-serif';document.body.appendChild(r)}r.innerHTML=`<div style="max-width:720px;margin:auto;padding:calc(env(safe-area-inset-top) + 22px) 18px 60px"><div class="tdh-no-trip-brand" style="display:flex;align-items:center;justify-content:space-between;gap:12px;font-weight:900">Track Day Heros 🏁</div><section style="margin-top:70px;border:1px solid #29333a;border-radius:20px;background:#10161a;padding:22px"><div style="color:#55f08c;font-size:10px;font-weight:950;letter-spacing:.18em">NO ACTIVE TRIP</div><h1 style="font-size:34px;margin:9px 0">${title}</h1><p style="color:#9aa6ad;line-height:1.5">${copy}</p><button data-plan style="width:100%;min-height:50px;margin-top:14px;border:0;border-radius:999px;background:#55f08c;color:#07130c;font-weight:950">PLAN THE NEXT ONE →</button></section></div>`;r.querySelector('[data-plan]').onclick=showPlan;window.TDHGlobalNav?.refresh?.()}
  async function latestCompletedEvent(){const c=creds();if(!c)return null;try{const r=await fetch(`${API}?${new URLSearchParams({action:'results-summary',...c})}`,{cache:'no-store'});if(!r.ok)return null;return await r.json()}catch{return null}}
  function patchNav(){const g=window.TDHGlobalNav;if(!g||g.__completedPatched)return false;g.__completedPatched=true;const oldTrip=g.showTrip,oldEvent=g.showEvent,oldResults=g.showResults,oldPlanning=g.showPlanning;
    g.showPlanning=()=>{clearNoTrip();return oldPlanning?.()};
    g.showTrip=(tab)=>completed()?noActiveTrip('Travel starts with a Trip.','Castle Combe is finished. Travel will unlock again when the Crew confirms the next track day.'):oldTrip?.(tab);
    g.showEvent=()=>completed()?noActiveTrip('Nothing live right now.','Castle Combe is safely in the history. EVENT will unlock for the next confirmed track day.'):oldEvent?.();
    g.showResults=async()=>{
      if(!completed())return oldResults?.();
      clearNoTrip();hideTripShell();document.querySelector('#planningV2')?.style.setProperty('display','none','important');
      const s=appState();if(!s)return noActiveTrip('Results unavailable.','The group is still loading. Try Results again in a moment.');
      const saved=s.confirmedEventId;
      try{
        const summary=await latestCompletedEvent();
        const prev=summary?.previousEvents||summary?.completedEvents||[];
        const latest=prev.map(x=>String(x.event_id||x.eventId||'')).filter(Boolean).sort((a,b)=>{const da=(a.match(/20\d{2}-\d{2}-\d{2}/)||[''])[0],db=(b.match(/20\d{2}-\d{2}-\d{2}/)||[''])[0];return db.localeCompare(da)})[0];
        if(latest){s.confirmedEventId=latest;await oldResults?.()}
        else noActiveTrip('No completed results found.','Castle Combe is archived. Its results will appear here as soon as the results service returns the completed event.')
      }catch(e){console.error('Completed results navigation failed',e);noActiveTrip('Could not open Results.','Castle Combe is still archived; please try Results again.')}
      finally{s.confirmedEventId=saved}
    };
    return true
  }
  function boot(){if(!patchNav()){setTimeout(boot,120);return}}
  // startup-route.js already waits for state.me before deciding where to send a
  // returning user. Do not force PLAN from this controller during hydration.
  setTimeout(boot,100);
})();