(() => {
  const css=document.createElement('style');
  css.textContent=`
    .planning-view-btn{margin-top:12px;min-height:42px}
    .planning-archive-banner{display:none;margin:0 0 16px;padding:15px 17px;border:1px solid #33453a;border-radius:18px;background:linear-gradient(145deg,#17251e,#11161a)}
    .planning-archive-banner strong{display:block;font-size:13px;letter-spacing:.08em;color:#78e5a4}.planning-archive-banner p{margin:5px 0 0;color:#9aa69e;font-size:12px}
    body.planning-archive-mode>.topbar,body.planning-archive-mode>main{display:block!important}
    body.planning-archive-mode>.trip-mode-shell{display:none!important}
    body.planning-archive-mode main{pointer-events:none}
    body.planning-archive-mode .planning-archive-banner,body.planning-archive-mode [data-planning-back],body.planning-archive-mode [data-attendance]{pointer-events:auto}
    body.planning-archive-mode .planning-archive-banner{display:block;pointer-events:auto}
    body.planning-archive-mode .confirmed-booking-card [data-unconfirm-trip]{display:none!important}
    body.planning-archive-mode .confirmed-booking-card .booking-actions{pointer-events:auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:stretch;gap:9px}
    body.planning-archive-mode .confirmed-booking-card .booking-choice{width:100%;min-width:0;margin:0;display:flex;align-items:center;justify-content:center;text-align:center}
    body.planning-archive-mode .confirmed-booking-card .booking-pressure{grid-column:1/-1;text-align:center;margin-top:2px}
    body.planning-archive-mode .confirmed-booking-card .booking-pressure,body.planning-archive-mode .confirmed-booking-card .booked-crew{pointer-events:none}
    body.planning-archive-mode .steps button,body.planning-archive-mode [data-stage]{pointer-events:auto}
    body.planning-archive-mode .stage button:not([data-attendance]):not([data-stage]):not([data-planning-back]),body.planning-archive-mode .stage input,body.planning-archive-mode .stage textarea,body.planning-archive-mode .stage select{pointer-events:none!important;opacity:.62}
    .planning-back{margin-top:11px;min-height:40px}
  `;
  document.head.appendChild(css);

  const myAttendance=()=>((state?.bookings)||[]).find(b=>b.event_id===state?.confirmedEventId&&b.member_id===state?.me?.id)?.attendance_status||'';

  function banner(){
    let el=document.querySelector('.planning-archive-banner');
    if(el)return el;
    el=document.createElement('section');el.className='planning-archive-banner';
    el.innerHTML='<strong>PLANNING · VIEW ONLY</strong><p>The trip is confirmed. Availability, choices and the group decision are now frozen.</p><button type="button" class="ghost planning-back" data-planning-back>← Back to Trip</button>';
    document.querySelector('main')?.prepend(el);
    el.querySelector('[data-planning-back]')?.addEventListener('click',exitPlanning);
    return el;
  }

  function enterPlanning(){
    if(!state?.confirmedEventId)return;
    banner();
    document.body.classList.add('planning-archive-mode');
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function exitPlanning(){
    document.body.classList.remove('planning-archive-mode');
    if(myAttendance()==='booked'){
      document.body.classList.add('trip-mode');
      window.scrollTo({top:0,behavior:'smooth'});
    }
  }

  function enhance(){
    if(!state?.confirmedEventId){document.body.classList.remove('planning-archive-mode');return;}
    banner();
    const shell=document.querySelector('.trip-mode-shell');
    if(shell&&!shell.querySelector('[data-view-planning]')){
      const actions=shell.querySelector('[data-trip-panel="home"] .trip-mode-actions');
      if(actions){
        const btn=document.createElement('button');btn.type='button';btn.className='ghost planning-view-btn';btn.dataset.viewPlanning='1';btn.textContent='View Planning';btn.addEventListener('click',enterPlanning);actions.prepend(btn);
      }
    }
  }

  const observer=new MutationObserver(()=>enhance());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  enhance();
})();