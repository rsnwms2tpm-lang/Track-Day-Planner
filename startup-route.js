(()=>{
let routed=false,attempts=0;
const visible=x=>x&&getComputedStyle(x).display!=='none';
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
    if(!ev){routed=true;window.TDHGlobalNav?.showPlanning?.();return}
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