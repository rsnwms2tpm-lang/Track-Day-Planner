(()=>{
let routed=false,attempts=0;
window.__tdhStartupRouteReady=false;
function finish(){window.__tdhStartupRouteReady=true;window.dispatchEvent(new Event('tdh:startup-route-ready'))}
function confirmedEvent(){
  const id=state?.confirmedEventId;if(!id)return null;
  const fromEvents=(typeof events!=='undefined'?events:[]).find(e=>e.id===id);
  if(fromEvents?.date)return {id,date:fromEvents.date};
  const m=String(id).match(/(20\d{2}-\d{2}-\d{2})/);
  return {id,date:m?.[1]||''};
}
function route(){
  if(routed)return;
  try{
    if(!session?.groupId||!state?.me)return;
    const ev=confirmedEvent();
    if(!ev){routed=true;window.TDHGlobalNav?.showPlanning?.();finish();return}
    const mine=(state.bookings||[]).find(b=>b.event_id===state.confirmedEventId&&b.member_id===state.me.id);
    const attending=!mine||(mine.attendance_status||'booked')==='booked';
    const d=ev.date?new Date(ev.date+'T07:00:00'):null,now=new Date();
    if(attending&&d&&now>=d){
      routed=true;
      Promise.resolve(window.TDHGlobalNav?.showEvent?.()).finally(()=>{setTimeout(()=>window.TDHTrackDayMode?.open?.(),80);finish()});
      return;
    }
    routed=true;
    window.TDHGlobalNav?.showTrip?.('home');
    requestAnimationFrame(()=>requestAnimationFrame(finish));
  }catch(e){console.warn('Startup route unavailable',e);finish()}
}
function tryRoute(){
  if(routed)return;
  attempts++;
  if(!window.TDHGlobalNav||typeof state==='undefined'||!state?.me){if(attempts<100)setTimeout(tryRoute,100);else finish();return}
  route();
}
setTimeout(tryRoute,0);
})();