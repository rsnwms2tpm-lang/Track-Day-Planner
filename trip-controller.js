(function(){
  renderTrip=function(){
    const el=document.querySelector('#tripSummary');
    if(!el)return;

    if(!state.confirmedEventId){
      el.innerHTML='<div class="card"><span class="eyebrow">TRACK DAY</span><h2>No trip confirmed yet</h2><p class="muted">Choose a Group Favourite in Decide, then confirm it to create the trip.</p></div>';
      const badge=document.querySelector('#trip .pill.success');
      if(badge)badge.textContent='AWAITING CONFIRMATION';
      return;
    }

    const e=(events||[]).find(x=>x.id===state.confirmedEventId);
    if(!e){
      el.innerHTML='<div class="card"><p class="muted">Loading the confirmed track day…</p></div>';
      return;
    }

    const members=state.members||[];
    const votes=(state.votes||[]).filter(v=>v.event_id===state.confirmedEventId);
    const statusFor=id=>votes.find(v=>v.member_id===id)?.status||'';
    const committed=members.filter(m=>statusFor(m.id)==='yes');
    const maybe=members.filter(m=>statusFor(m.id)==='maybe');
    const notGoing=members.filter(m=>statusFor(m.id)==='no');
    const unanswered=members.filter(m=>!statusFor(m.id));
    const row=m=>`<div class="attendance-row"><span>${m.name}</span><span class="meta">${m.car||''}</span></div>`;
    const block=(label,list,empty)=>`<div style="margin-top:22px"><span class="eyebrow">${label}</span>${list.length?list.map(row).join(''):`<p class="muted">${empty}</p>`}</div>`;

    el.innerHTML=`<div class="trip-grid"><div class="card"><span class="eyebrow">TRACK DAY</span><h2>${e.track}</h2><p>${new Date(e.date+'T12:00:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})} · ${e.provider} · ${e.price!=null?'£'+e.price:'Price TBC'}</p><span class="pill success">TRACK CONFIRMED</span></div><div class="card"><span class="eyebrow">ATTENDANCE</span><h3>${committed.length} committed driver${committed.length===1?'':'s'}</h3>${block('GOING',committed,'Nobody has committed yet.')}${maybe.length?block('MAYBE',maybe,''):''}${notGoing.length?block('NOT GOING',notGoing,''):''}${unanswered.length?block('NO RESPONSE',unanswered,''):''}</div></div>`;

    const badge=document.querySelector('#trip .pill.success');
    if(badge)badge.textContent='CONFIRMED';
  };

  if(state&&state.me)renderTrip();
})();