(()=>{
let routed=false,attempts=0;
const localToday=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
function confirmedEvent(){
  const id=state?.confirmedEventId;if(!id)return null;
  const fromEvents=(typeof events!=='undefined'?events:[]).find(e=>e.id===id);
  if(fromEvents?.date)return {id,date:fromEvents.date};
  const m=String(id).match(/(20\d{2}-\d{2}-\d{2})/);
  return {id,date:m?.[1]||''};
}
function route(){
  if(routed)return;
  attempts++;
  try{
    if(!session?.groupId||!state?.me)return;
    const ev=confirmedEvent();
    // No event, or the retained event is already in the past: planning is the live workspace.
    // The old confirmedEventId remains available to Results/late lap imports.
    if(!ev||(ev.date&&ev.date<localToday())){routed=true;window.TDHGlobalNav?.showPlanning?.();return}
    const mine=(state.bookings||[]).find(b=>b.event_id===state.confirmedEventId&&b.member_id===state.me.id);
    const attending=!mine||(mine.attendance_status||'booked')==='booked';
    const d=ev.date?new Date(ev.date+'T07:00:00'):null,now=new Date();
    if(attending&&d&&now>=d){routed=true;window.TDHGlobalNav?.showEvent?.();setTimeout(()=>window.TDHTrackDayMode?.open?.(),80);return}
    routed=true;window.TDHGlobalNav?.showTrip?.('home');
  }catch(e){console.warn('Startup route unavailable',e)}
}
function tryRoute(){
  if(routed)return;
  if(!window.TDHGlobalNav||typeof state==='undefined'||!state?.me){if(attempts++<80)setTimeout(tryRoute,100);return}
  route();
}
window.addEventListener('tdh:startup-complete',()=>setTimeout(tryRoute,0),{once:true});
if(!document.documentElement.classList.contains('tdh-booting'))setTimeout(tryRoute,0);
})();