(()=>{
  const KEY='tdh-track-day-mode-v1';
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
  const save=s=>localStorage.setItem(KEY,JSON.stringify(s));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const uid=()=>Math.random().toString(36).slice(2,10);
  const fmt=t=>{const n=Number(t);if(!Number.isFinite(n))return '—';const m=Math.floor(n/60),s=(n%60).toFixed(3).padStart(6,'0');return `${m}:${s}`};
  function baseState(){return {results:[],bingo:[],legend:{nominations:[],votes:[],phase:'nominate',startedAt:Date.now(),tieCandidates:[]}}}
  function getStore(){const s=load();return Object.assign(baseState(),s,{legend:Object.assign(baseState().legend,s.legend||{})})}
  function members(){return (window.state&&Array.isArray(state.members)?state.members:[]).map(m=>({id:m.id,name:m.name,car:m.car||''}))}
  function currentTrip(){
    const confirmed=window.state?.confirmedEventId;
    const ev=(window.events||[]).find(e=>e.id===confirmed);
    return ev||null;
  }
  function tripCarForMember(memberId){
    const eventId=window.state?.confirmedEventId;
    const booking=(window.state?.bookings||[]).find(b=>b.event_id===eventId&&b.member_id===memberId);
    const bookedCar=booking?.car||booking?.vehicle||booking?.confirmed_car||booking?.car_name||'';
    if(bookedCar)return bookedCar;
    return members().find(m=>m.id===memberId)?.car||'';
  }
  function ensureUI(){
    const nav=document.querySelector('.steps');
    if(nav&&!nav.querySelector('[data-stage="trackday"]')){
      const b=document.createElement('button');b.dataset.stage='trackday';b.textContent='5 Track Day';nav.appendChild(b);
    }
    const main=document.querySelector('main');
    if(main&&!document.querySelector('#trackday')){
      const sec=document.createElement('section');sec.id='trackday';sec.className='stage';
      sec.innerHTML='<div class="section-head"><div><span class="eyebrow">STEP 05</span><h2>Track Day Mode</h2></div><span class="pill">LIVE / POST-TRIP</span></div><div id="trackDayModeRoot"></div>';
      main.appendChild(sec);
    }
    document.querySelectorAll('.steps [data-stage]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        document.querySelectorAll('.steps [data-stage]').forEach(x=>x.classList.toggle('active',x===btn));
        document.querySelectorAll('.stage').forEach(x=>x.classList.toggle('active',x.id===btn.dataset.stage));
        if(btn.dataset.stage==='trackday') render();
      });
    });
  }
  function resultCard(r){return `<article class="card result-card"><div><span class="eyebrow">${esc(r.driver)} · ${esc(r.car)}</span><h3>${esc(r.track||'Track day result')}</h3><p class="muted">${esc(r.session||'Session')} ${r.guest?'· guest drive':''}</p></div><div class="result-time"><strong>${fmt(r.bestLap)}</strong><span>best lap</span></div>${r.screenshotName?`<div class="result-proof">📷 ${esc(r.screenshotName)}</div>`:''}</article>`}
  function renderResults(s,trip){
    const ms=members(),meId=window.state?.me?.id||'',defaultMember=ms.find(m=>m.id===meId)||ms[0]||null,defaultCar=defaultMember?tripCarForMember(defaultMember.id):'';
    return `<div class="trackday-grid"><div class="card"><span class="eyebrow">RESULTS</span><h3>Driver + car</h3><p class="muted">Results stay attached to the driver and the car actually used on this trip.</p><form id="resultForm" class="stack"><label>Driver<select id="resultDriver">${ms.map(m=>`<option value="${esc(m.id)}" data-car="${esc(tripCarForMember(m.id))}" ${m.id===defaultMember?.id?'selected':''}>${esc(m.name)}</option>`).join('')}<option value="guest">Guest driver</option></select></label><label id="guestNameWrap" hidden>Guest name<input id="guestName" maxlength="40" placeholder="Name"></label><label>Car<input id="resultCar" maxlength="60" value="${esc(defaultCar)}"></label><label>Session<input id="resultSession" maxlength="40" placeholder="e.g. Session 4"></label><label>Best lap<input id="resultLap" inputmode="decimal" placeholder="seconds, e.g. 80.432"></label><label class="file-label">Lap screenshot<input id="resultScreenshot" type="file" accept="image/*"></label><button class="primary wide" type="submit">Save result</button></form></div><div><div class="section-head compact"><div><span class="eyebrow">RIVALRY</span><h3>Results board</h3></div></div><div class="cards">${s.results.length?s.results.sort((a,b)=>a.bestLap-b.bestLap).map(resultCard).join(''):'<div class="card"><p class="muted">No results yet. Add the first one after a session.</p></div>'}</div></div></div>`;
  }
  function renderBingo(s){
    return `<div class="card"><span class="eyebrow">BINGO CASUALTIES</span><h3>What happened today? 😂</h3><form id="bingoForm" class="inline-form"><input id="bingoText" maxlength="100" placeholder="e.g. missed fuel, black flag, spun at Quarry…"><button type="submit">Add</button></form><div class="bingo-list">${s.bingo.length?s.bingo.map((b,i)=>`<div class="bingo-row"><span>${esc(b.text)}</span><button data-del-bingo="${i}" class="ghost small">×</button></div>`).join(''):'<p class="muted">Nothing embarrassing logged. Yet.</p>'}</div></div>`;
  }
  function legendWinner(legend){const c={};legend.votes.forEach(v=>c[v.nominee]=(c[v.nominee]||0)+1);const vals=Object.entries(c).sort((a,b)=>b[1]-a[1]);if(!vals.length)return null;if(vals.length>1&&vals[0][1]===vals[1][1])return {tie:vals.filter(x=>x[1]===vals[0][1]).map(x=>x[0])};return {winner:vals[0][0],count:vals[0][1]}}
  function renderLegend(s){
    const ms=members(),L=s.legend,w=legendWinner(L);
    const nominees=[...new Set(L.nominations.map(n=>n.nominee))];
    return `<div class="card legend-card"><span class="eyebrow">CREW LEGEND 🏆</span><h3>${L.phase==='nominate'?'Nominate the day’s legend':L.phase==='vote'?'48-hour Crew Legend vote':L.phase==='tiebreak'?'24-hour tie-break':'Crew Legend crowned'}</h3><p class="muted">The crew decide it. Heros only counts the votes.</p>${L.phase==='nominate'?`<form id="nominationForm" class="stack"><label>Nominate<select id="nominee">${ms.map(m=>`<option value="${esc(m.name)}">${esc(m.name)}</option>`).join('')}</select></label><label>Why?<input id="nominationReason" maxlength="120" placeholder="The moment that earned it"></label><button class="primary" type="submit">Nominate</button></form>${L.nominations.map(n=>`<p><strong>${esc(n.nominee)}</strong> — ${esc(n.reason)}</p>`).join('')}<button id="openLegendVote" ${nominees.length<2?'disabled':''}>Lock nominations & start 48h vote</button>`:''}${L.phase==='vote'||L.phase==='tiebreak'?`<div class="legend-options">${(L.phase==='tiebreak'?L.tieCandidates:nominees).map(n=>`<button data-legend-vote="${esc(n)}" class="choice-btn">${esc(n)}</button>`).join('')}</div><p class="muted">${L.votes.length} vote${L.votes.length===1?'':'s'} cast</p><button id="closeLegendVote">${L.phase==='vote'?'Close vote / check result':'Close tie-break'}</button>`:''}${L.phase==='done'&&w?.winner?`<div class="legend-winner"><strong>${esc(w.winner)}</strong><span>holds the trophy until next time 🏆</span></div><button id="resetLegend" class="ghost">Start next trip’s Legend</button>`:''}</div>`;
  }
  function wire(s,trip){
    const form=document.querySelector('#resultForm');if(form){
      const sel=document.querySelector('#resultDriver'),car=document.querySelector('#resultCar'),guestWrap=document.querySelector('#guestNameWrap');
      sel.onchange=()=>{const guest=sel.value==='guest';guestWrap.hidden=!guest;if(!guest)car.value=sel.selectedOptions[0]?.dataset.car||'';else car.value=''};
      form.onsubmit=e=>{e.preventDefault();const guest=sel.value==='guest';const lap=Number(document.querySelector('#resultLap').value);if(!Number.isFinite(lap)||lap<=0)return alert('Add the lap time in seconds.');const file=document.querySelector('#resultScreenshot').files[0];const member=members().find(m=>m.id===sel.value);s.results.push({id:uid(),tripId:trip?.id||'unconfirmed',track:trip?.track||'',date:trip?.date||'',driver:guest?(document.querySelector('#guestName').value.trim()||'Guest'):member?.name||'Driver',car:car.value.trim()||'Car not set',guest,session:document.querySelector('#resultSession').value.trim(),bestLap:lap,screenshotName:file?.name||''});save(s);render()};
    }
    const bf=document.querySelector('#bingoForm');if(bf)bf.onsubmit=e=>{e.preventDefault();const t=document.querySelector('#bingoText').value.trim();if(t){s.bingo.push({text:t,at:Date.now()});save(s);render()}};
    document.querySelectorAll('[data-del-bingo]').forEach(b=>b.onclick=()=>{s.bingo.splice(Number(b.dataset.delBingo),1);save(s);render()});
    const nf=document.querySelector('#nominationForm');if(nf)nf.onsubmit=e=>{e.preventDefault();const nominee=document.querySelector('#nominee').value,reason=document.querySelector('#nominationReason').value.trim();s.legend.nominations.push({nominee,reason,at:Date.now()});save(s);render()};
    const open=document.querySelector('#openLegendVote');if(open)open.onclick=()=>{s.legend.phase='vote';s.legend.startedAt=Date.now();s.legend.votes=[];save(s);render()};
    document.querySelectorAll('[data-legend-vote]').forEach(b=>b.onclick=()=>{const voter=window.state?.me?.id||'local';s.legend.votes=s.legend.votes.filter(v=>v.voter!==voter);s.legend.votes.push({voter,nominee:b.dataset.legendVote,at:Date.now()});save(s);render()});
    const close=document.querySelector('#closeLegendVote');if(close)close.onclick=()=>{const w=legendWinner(s.legend);if(w?.tie&&w.tie.length>1){s.legend.phase='tiebreak';s.legend.tieCandidates=w.tie;s.legend.votes=[];s.legend.startedAt=Date.now()}else{s.legend.phase='done'}save(s);render()};
    const reset=document.querySelector('#resetLegend');if(reset)reset.onclick=()=>{s.legend=baseState().legend;s.results=[];s.bingo=[];save(s);render()};
  }
  function render(){ensureUI();const root=document.querySelector('#trackDayModeRoot');if(!root)return;const s=getStore(),trip=currentTrip();root.innerHTML=`${trip?`<div class="card trip-banner"><div><span class="eyebrow">${esc(trip.date||'')}</span><h2>${esc(trip.track)}</h2><p class="muted">${esc(trip.provider||'')} · ${esc(trip.format||'Track day')}</p></div><span class="pill success">TRIP MODE</span></div>`:'<div class="card"><h3>Track Day Mode is ready</h3><p class="muted">Confirm a trip first, then use this area before, during and after the day.</p></div>'}${renderResults(s,trip)}<div class="trackday-grid secondary">${renderBingo(s)}${renderLegend(s)}</div>`;wire(s,trip)}
  window.TDHTrackDayMode={render};
  document.addEventListener('DOMContentLoaded',()=>{ensureUI();setTimeout(render,400)});
})();