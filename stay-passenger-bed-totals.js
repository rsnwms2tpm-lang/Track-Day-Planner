(() => {
  function bedCount(row){
    const flags=Array.isArray(row?.passenger_bed_flags)?row.passenger_bed_flags:[];
    return flags.filter(Boolean).length;
  }

  function updateStay(){
    const summary=document.querySelector('.trip-mode-shell .stay-summary');
    if(!summary) return;
    const eventId=state?.confirmedEventId;
    const bookedIds=new Set(((state?.bookings)||[])
      .filter(b=>b.event_id===eventId&&(b.attendance_status||'booked')==='booked')
      .map(b=>b.member_id));
    const rows=((state?.tripDetails)||[]).filter(r=>r.event_id===eventId&&bookedIds.has(r.member_id));

    let before=0,after=0;
    rows.forEach(r=>{
      const extraBeds=bedCount(r);
      if(r.night_before) before+=1+extraBeds;
      if(r.night_after) after+=1+extraBeds;
    });

    const stats=[...summary.querySelectorAll('.stay-stat strong')];
    if(stats[2]) stats[2].textContent=String(before);
    if(stats[3]) stats[3].textContent=String(after);

    const nights=[...summary.querySelectorAll('.stay-night strong')];
    if(nights[0]) nights[0].textContent=`${before} bed${before===1?'':'s'}`;
    if(nights[1]) nights[1].textContent=`${after} bed${after===1?'':'s'}`;
  }

  const observer=new MutationObserver(updateStay);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  updateStay();
})();
