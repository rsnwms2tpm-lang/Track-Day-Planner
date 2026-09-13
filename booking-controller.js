(() => {
  const avatarNames={
    'driver-01':'Clean Cut','driver-02':'Bearded','driver-03':'Stubble','driver-04':'Shades','driver-05':'Cap','driver-06':'Balaclava','driver-07':'Glasses','driver-08':'Older Pro','driver-09':'Bald Stubble','driver-10':'Bald Beard','driver-11':'Long Hair','driver-12':'Moustache','driver-13':'Headphones','driver-14':'Bucket Hat','driver-15':'Wild Card','driver-16':'Track Rat',
    'helmet-01':'Classic White','helmet-02':'Stealth','helmet-03':'Red Rocket','helmet-04':'Blue Thunder','helmet-05':'High Viz','helmet-06':'Matte Black','helmet-07':'Retro','helmet-08':'Orange Fury','helmet-09':'Purple Haze','helmet-10':'M Power','helmet-11':'British Bulldog','helmet-12':'Skull','helmet-13':'Pink Speed','helmet-14':'Camo','helmet-15':'Chicken','helmet-16':'Rainbow'
  };

  const css=document.createElement('style');
  css.textContent=`
    .confirmed-booking-card{margin:0 0 18px;border:1px solid rgba(98,211,145,.42);background:linear-gradient(145deg,rgba(41,68,57,.96),rgba(25,30,34,.98));overflow:hidden}
    .confirmed-booking-top{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}
    .confirmed-booking-card h3{font-size:22px;margin:3px 0 5px}
    .confirmed-booking-card .confirmed-date{margin:0;color:#d6dde5}
    .booking-countdown{text-align:right;min-width:112px}
    .booking-countdown strong{display:block;font-size:20px;line-height:1.05;color:#fff}
    .booking-countdown span{font-size:11px;letter-spacing:.08em;color:#9da9b5}
    .booking-actions{display:flex;align-items:center;gap:12px;margin-top:17px;flex-wrap:wrap}
    .booking-toggle{min-height:44px;font-weight:800;border-color:#6ad69a}
    .booking-toggle.booked{background:#5fd08d;color:#07130c;border-color:#5fd08d}
    .booking-pressure{font-size:13px;color:#aab5c0}
    .booked-crew{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
    .booked-driver{display:flex;align-items:center;gap:7px;border:1px solid #3d4651;background:#20252b;border-radius:999px;padding:5px 9px 5px 5px;font-size:12px;font-weight:700}
    .booked-avatar{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#2b313a;border:1px solid #707985;color:#fff;font-weight:900;overflow:hidden;flex:none}
    .booked-avatar.tdp-avatar{font-size:0}
    .booking-empty{font-size:13px;color:#9da9b5;margin-top:12px}
    .bingo-ready{margin-top:12px;padding:9px 11px;border-radius:10px;background:rgba(95,208,141,.11);border:1px solid rgba(95,208,141,.32);font-size:12px;font-weight:800;color:#bff3d1}
    @media(max-width:560px){.confirmed-booking-top{align-items:flex-start}.booking-countdown strong{font-size:17px}.confirmed-booking-card h3{font-size:19px}}
  `;
  document.head.appendChild(css);

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const eventForConfirmed=()=>Array.isArray(events)?events.find(e=>e.id===state?.confirmedEventId):null;
  const bookedRows=()=>((state?.bookings)||[]).filter(b=>b.event_id===state?.confirmedEventId);
  const expectedRows=()=>((state?.expectedBookedMembers)||[]).filter(b=>b.event_id===state?.confirmedEventId);
  const bookedIds=()=>new Set(bookedRows().map(b=>b.member_id));

  function countdownText(date){
    if(!date)return 'COUNTDOWN';
    const target=new Date(date+'T00:00:00');
    const now=new Date();
    const diff=target-now;
    if(diff<=0 && now.toDateString()===target.toDateString())return 'TRACK DAY TODAY 🏁';
    if(diff<=0)return 'TRACK DAY COMPLETE';
    const mins=Math.floor(diff/60000);
    const days=Math.floor(mins/1440);
    const hours=Math.floor((mins%1440)/60);
    const minutes=mins%60;
    if(days>0)return `${days}d ${hours}h ${minutes}m`;
    return `${hours}h ${minutes}m`;
  }

  function avatarHtml(m){
    const avatar=String(m.avatar||'');
    const title=avatarNames[avatar];
    if(title)return `<span class="booked-avatar tdp-avatar" title="${esc(title)}" aria-label="${esc(m.name)}"></span>`;
    return `<span class="booked-avatar">${esc((m.name||'?').trim().charAt(0).toUpperCase()||'?')}</span>`;
  }

  function cardHtml(){
    const e=eventForConfirmed();
    if(!e)return '';
    const ids=bookedIds();
    const expected=expectedRows();
    const expectedBooked=expected.filter(x=>ids.has(x.member_id)).length;
    const meBooked=!!state?.me&&ids.has(state.me.id);
    const bookedMembers=(state.members||[]).filter(m=>ids.has(m.id));
    const dateLabel=new Date(e.date+'T12:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'long',year:'numeric'});
    const crew=bookedMembers.length?`<div class="booked-crew">${bookedMembers.map(m=>`<div class="booked-driver">${avatarHtml(m)}<span>${esc(m.name)}</span><span>✓</span></div>`).join('')}</div>`:`<div class="booking-empty">Nobody has hit Booked yet. Someone has to go first… 😂</div>`;
    const pressure=expected.length?`${expectedBooked}/${expected.length} of the original Going crew booked`:`${bookedMembers.length} booked`;
    return `<div class="card confirmed-booking-card">
      <div class="confirmed-booking-top">
        <div><span class="eyebrow">🏁 CONFIRMED TRACK DAY</span><h3>${esc(e.track)}</h3><p class="confirmed-date">${esc(dateLabel)} · ${esc(e.provider||'Provider TBC')}</p></div>
        <div class="booking-countdown"><strong data-booking-countdown="${esc(e.date)}">${esc(countdownText(e.date))}</strong><span>TO GO</span></div>
      </div>
      <div class="booking-actions">
        <button type="button" class="booking-toggle ${meBooked?'booked':''}" data-booking-toggle>${meBooked?'✓ BOOKED':'☐ I’M BOOKED'}</button>
        <span class="booking-pressure">${esc(pressure)}</span>
      </div>
      ${crew}
      ${state.bingoUnlocked?'<div class="bingo-ready">🔓 Broken Car Bingo unlocked for the crew</div>':''}
    </div>`;
  }

  async function toggleBooked(btn){
    if(!state?.confirmedEventId||!session)return;
    const isBooked=bookedIds().has(state.me.id);
    btn.disabled=true;
    btn.textContent=isBooked?'Updating…':'Booking…';
    try{
      await api('book-event','POST',{groupId:session.groupId,token:session.memberToken,eventId:state.confirmedEventId,booked:!isBooked});
      await loadGroup();
    }catch(err){
      alert('Could not update booking: '+(err?.message||err));
      btn.disabled=false;
      renderBookingCards();
    }
  }

  function renderBookingCards(){
    document.querySelectorAll('.confirmed-booking-card').forEach(n=>n.remove());
    if(!state?.confirmedEventId)return;
    const html=cardHtml();
    if(!html)return;
    document.querySelectorAll('.stage').forEach(stage=>{
      const wrap=document.createElement('div');
      wrap.innerHTML=html;
      const card=wrap.firstElementChild;
      stage.prepend(card);
      const btn=card.querySelector('[data-booking-toggle]');
      if(btn)btn.onclick=()=>toggleBooked(btn);
    });
  }

  function tickCountdowns(){
    document.querySelectorAll('[data-booking-countdown]').forEach(el=>{el.textContent=countdownText(el.dataset.bookingCountdown)});
  }

  const previousRender=window.render;
  if(typeof previousRender==='function')window.render=function(){const out=previousRender.apply(this,arguments);renderBookingCards();return out};
  const previousTrip=window.renderTrip;
  if(typeof previousTrip==='function')window.renderTrip=function(){const out=previousTrip.apply(this,arguments);renderBookingCards();return out};

  setInterval(tickCountdowns,60000);
  if(state?.me)renderBookingCards();
})();