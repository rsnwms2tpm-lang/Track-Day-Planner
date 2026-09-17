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
  const appState=()=>{try{return typeof state!=='undefined'?state:null}catch{return null}};
  const bookedCrew=()=>{const s=appState();if(!s)return[];const eventId=s.confirmedEventId;const ids=new Set((s.bookings||[]).filter(b=>b.event_id===eventId&&(b.attendance_status||'booked')==='booked').map(b=>String(b.member_id)));return (s.members||[]).filter(m=>ids.has(String(m.id)))};

  function card(){return [...document.querySelectorAll('.trip-mode-grid>.trip-mode-card')].find(c=>/WHO.?S IN/i.test(c.textContent||''))||null}
  function crewRows(box){return [...box.querySelectorAll('.trip-crew-row')].filter(r=>!r.dataset.tdhPassengerIdentity)}

  function paint(){
    const box=card();if(!box)return;
    const ps=passengers(),crew=bookedCrew(),rows=crewRows(box);
    box.querySelectorAll('[data-tdh-passenger-identity]').forEach(n=>n.remove());
    box.querySelectorAll('.tdh-hosted-passengers').forEach(n=>n.remove());

    const heading=box.querySelector('h3');
    if(heading)heading.textContent=`${crew.length+ps.length} PEOPLE IN`;

    for(const p of ps.filter(x=>!x.claimed)){
      const hostId=String(p.added_by_member_id||'');
      const hostIndex=crew.findIndex(m=>String(m.id)===hostId);
      const row=hostIndex>=0?rows[hostIndex]:null;
      if(!row)continue;
      const detail=document.createElement('span');
      detail.className='tdh-hosted-passengers';
      detail.innerHTML=`<span class="tdh-hosted-passenger">+ ${esc(p.name)} — Passenger</span>`;
      const nameCell=row.querySelector('span:first-child')||row.firstElementChild||row;
      nameCell.appendChild(detail);
    }

    for(const p of ps.filter(x=>x.claimed)){
      const row=document.createElement('div');
      row.className='trip-crew-row tdh-passenger-identity';
      row.dataset.tdhPassengerIdentity=String(p.id||'1');
      row.innerHTML=`<span>${esc(p.name)}</span><span class="trip-car">Passenger</span>`;
      box.appendChild(row);
    }
  }

  let timer=0;
  const schedule=()=>{clearTimeout(timer);timer=setTimeout(paint,80)};
  window.addEventListener('tdh-passengers-changed',schedule);
  window.addEventListener('tdh-trip-rendered',schedule);
  document.addEventListener('click',e=>{if(e.target.closest('[data-trip-tab="home"],button'))setTimeout(paint,120)},true);
  setTimeout(paint,500);
  setTimeout(paint,1500);
})();