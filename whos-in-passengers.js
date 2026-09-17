(() => {
  const style=document.createElement('style');
  style.textContent=`
    .tdh-hosted-passengers{display:block;margin-top:5px;color:#aab4bd;font-size:12px;line-height:1.45}
    .tdh-hosted-passenger{display:block}
    .tdh-passenger-identity .trip-car{color:#72df9e}
  `;
  document.head.appendChild(style);

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const passengers=()=>Array.isArray(window.tdhTripPassengers)?window.tdhTripPassengers.filter(p=>(p.participation_status||'active')==='active'):[];
  const bookedCrew=()=>{try{const eventId=state?.confirmedEventId;const ids=new Set(((state?.bookings)||[]).filter(b=>b.event_id===eventId&&(b.attendance_status||'booked')==='booked').map(b=>b.member_id));return (state?.members||[]).filter(m=>ids.has(m.id))}catch{return[]}};

  function card(){
    return [...document.querySelectorAll('.trip-mode-grid>.trip-mode-card')].find(c=>/WHO.?S IN/i.test(c.textContent||''));
  }

  function paint(){
    const box=card();if(!box)return;
    const ps=passengers(),crew=bookedCrew();
    box.querySelectorAll('[data-tdh-passenger-identity]').forEach(n=>n.remove());
    box.querySelectorAll('.tdh-hosted-passengers').forEach(n=>n.remove());

    const heading=box.querySelector('h3');
    if(heading)heading.textContent=`${crew.length+ps.length} PEOPLE IN`;

    const crewRows=[...box.querySelectorAll('.trip-crew-row')].filter(r=>!r.dataset.tdhPassengerIdentity);
    for(const p of ps.filter(x=>!x.claimed)){
      const hostId=String(p.added_by_member_id||'');
      const hostIndex=crew.findIndex(m=>String(m.id)===hostId);
      const row=hostIndex>=0?crewRows[hostIndex]:null;
      if(!row)continue;
      let detail=row.querySelector('.tdh-hosted-passengers');
      if(!detail){detail=document.createElement('span');detail.className='tdh-hosted-passengers';const name=row.querySelector('span:first-child')||row.firstElementChild;name?.appendChild(detail)}
      detail.insertAdjacentHTML('beforeend',`<span class="tdh-hosted-passenger">+ ${esc(p.name)} — Passenger</span>`);
    }

    for(const p of ps.filter(x=>x.claimed)){
      const row=document.createElement('div');
      row.className='trip-crew-row tdh-passenger-identity';
      row.dataset.tdhPassengerIdentity=p.id||'1';
      row.dataset.tdhPassengerIdentity='1';
      row.innerHTML=`<span>${esc(p.name)}</span><span class="trip-car">Passenger</span>`;
      box.appendChild(row);
    }
  }

  window.addEventListener('tdh-passengers-changed',paint);
  new MutationObserver(()=>paint()).observe(document.body,{childList:true,subtree:true});
  setInterval(paint,1200);
  paint();
})();