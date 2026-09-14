(() => {
  function bedCount(row){
    const flags=Array.isArray(row?.passenger_bed_flags)?row.passenger_bed_flags:[];
    return flags.filter(Boolean).length;
  }

  function setText(el,value){
    if(el&&el.textContent!==value)el.textContent=value;
  }

  function updateStay(){
    const summary=document.querySelector('.trip-mode-shell .stay-summary');
    if(!summary)return;
    const eventId=state?.confirmedEventId;
    const bookedIds=new Set(((state?.bookings)||[])
      .filter(b=>b.event_id===eventId&&(b.attendance_status||'booked')==='booked')
      .map(b=>b.member_id));
    const rows=((state?.tripDetails)||[]).filter(r=>r.event_id===eventId&&bookedIds.has(r.member_id));

    let before=0,after=0;
    rows.forEach(r=>{
      const extraBeds=bedCount(r);
      if(r.night_before)before+=1+extraBeds;
      if(r.night_after)after+=1+extraBeds;
    });

    const stats=[...summary.querySelectorAll('.stay-stat strong')];
    setText(stats[2],String(before));
    setText(stats[3],String(after));

    const nights=[...summary.querySelectorAll('.stay-night strong')];
    setText(nights[0],`${before} bed${before===1?'':'s'}`);
    setText(nights[1],`${after} bed${after===1?'':'s'}`);
  }

  let queued=false;
  function queueUpdate(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      updateStay();
    });
  }

  const observer=new MutationObserver(mutations=>{
    const onlyOwnChanges=mutations.every(m=>m.target?.closest?.('.stay-summary'));
    if(!onlyOwnChanges)queueUpdate();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  queueUpdate();
})();
