(() => {
  const style=document.createElement('style');
  style.textContent=`
    .trip-home-control-wrap{display:flex;justify-content:center;padding:2px 0 16px}
    .trip-home-control{border:1px solid #3f7657;background:#101a14;color:#72df9e;font-size:14px;font-weight:950;letter-spacing:.16em;padding:11px 25px;border-radius:14px;opacity:1;transition:background .15s,color .15s,border-color .15s}
    .trip-home-control.active{background:#f1f5f2;color:#0b0f0d;border-color:#f1f5f2}
    .trip-event-mini{display:none;align-items:center;justify-content:space-between;gap:14px;margin:0 0 12px;padding:15px 17px;border:1px solid #29323a;border-radius:18px;background:linear-gradient(135deg,#171d22,#0e1216)}
    .trip-event-mini-copy{min-width:0}.trip-event-mini .eyebrow{font-size:9px;color:#70db9b}.trip-event-mini h2{margin:4px 0 3px;font-size:22px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.trip-event-mini p{margin:0;color:#929da8;font-size:12px}
    .trip-event-mini-count{text-align:right;flex:none}.trip-event-mini-count strong{display:block;font-size:17px}.trip-event-mini-count span{display:block;margin-top:3px;font-size:8px;letter-spacing:.14em;color:#78838f}
    .trip-tabs{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px!important;overflow:visible!important;padding:0 0 15px!important;margin:0!important}
    .trip-tab{width:100%;padding:10px 4px!important;text-align:center}.trip-tab.tdh-needs-recheck,.trip-tab.tdh-needs-recheck.active{border-color:#d7832d!important;background:#4a2b0b!important;color:#ffc06b!important;box-shadow:inset 0 0 0 1px rgba(255,184,92,.18)!important}
    .trip-placeholder{margin-top:6px;text-align:center;padding:34px 20px}.trip-placeholder h2{margin:6px 0 8px}.trip-placeholder p{margin:0;color:#929da8}
    .trip-mode-shell.trip-subpage .trip-event-mini{display:flex}
    .trip-mode-shell.trip-homepage .trip-tabs{margin-top:15px!important}
    .trip-status-box{position:sticky;top:8px;z-index:6;margin:14px 0 18px;padding:14px 15px;border:1px solid #33453a;border-radius:18px;background:rgba(17,27,21,.96);backdrop-filter:blur(12px);box-shadow:0 12px 34px rgba(0,0,0,.25)}
    .trip-status-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}.trip-status-head strong{font-size:11px;letter-spacing:.14em}.trip-status-head span{font-size:10px;color:#72df9e;font-weight:900}
    .trip-status-list{display:grid;gap:7px}.trip-status-item{display:flex;gap:9px;align-items:flex-start;font-size:12px;color:#cbd4ce}.trip-status-item.done{color:#849087}.trip-status-check{width:17px;height:17px;border:1px solid #526058;border-radius:5px;display:grid;place-items:center;flex:none;margin-top:1px;font-size:11px}.trip-status-item.done .trip-status-check{background:#1c3828;border-color:#3b7650;color:#78e5a4}.trip-status-note{margin-top:9px;padding-top:9px;border-top:1px solid #2a352e;color:#87948b;font-size:10px}
    .departure-card.tdh-departure-saved .departure-form{display:none!important}
    .departure-card.tdh-departure-saved .departure-head{align-items:center!important}
    .departure-card.tdh-departure-saved .departure-head>div{width:100%!important;text-align:center!important}
    .departure-card.tdh-departure-saved .departure-head h3{font-size:30px!important;line-height:1.1!important;margin:18px 0 8px!important;text-align:center!important}
    .departure-card.tdh-departure-saved .departure-summary{gap:10px!important;margin-top:10px!important}
    .departure-card.tdh-departure-saved .departure-summary>div{padding:10px 12px!important;text-align:center!important}
    .departure-card.tdh-departure-saved .departure-summary strong{font-size:15px!important;line-height:1.25!important}
    .trip-mode-card:has(.travel-actions){text-align:center!important}
    .trip-mode-card:has(.travel-actions) .muted{max-width:520px!important;margin-left:auto!important;margin-right:auto!important}
    .trip-mode-card .travel-actions>a.travel-destination{text-align:center!important}
    .departure-card.tdh-departure-saved .departure-summary>strong,.departure-card.tdh-departure-saved .departure-location{display:block!important;text-align:center!important;font-size:27px!important;line-height:1.15!important;margin:12px auto 16px!important}
    .departure-card.tdh-departure-saved .departure-summary-grid{gap:10px!important}
    .departure-card.tdh-departure-saved .departure-summary-grid>div{padding:12px 14px!important;min-height:0!important}
    .departure-card.tdh-departure-saved .departure-summary-grid strong{font-size:16px!important;line-height:1.25!important}.departure-edit{display:none!important;border:1px solid #344139!important;border-radius:999px!important;background:#141c18!important;color:#edf4ef!important;padding:7px 11px!important;font-size:10px!important;font-weight:900!important}.departure-card.tdh-departure-saved .departure-edit{display:inline-flex!important}
    .travel-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;margin-top:14px!important}.trip-mode-card .travel-actions>a.travel-destination{display:flex!important;box-sizing:border-box!important;align-items:center!important;justify-content:space-between!important;min-height:58px!important;padding:0 16px!important;border:1px solid #344139!important;border-radius:16px!important;background:#141c18!important;color:#edf4ef!important;text-decoration:none!important;font-size:13px!important;font-weight:950!important;letter-spacing:.03em!important}.trip-mode-card .travel-actions>a.travel-destination:after{content:none!important}.trip-mode-card .travel-actions>a.travel-destination.is-unavailable{display:none!important}
    @media(max-width:620px){.trip-event-mini{padding:13px 14px}.trip-event-mini h2{font-size:19px}.trip-event-mini-count strong{font-size:15px}.trip-tab{font-size:11px!important}.trip-status-box{top:7px}}
  `;
  document.head.appendChild(style);
  const esc=s=>String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  window.__tdhTripPanel=window.__tdhTripPanel||'home';
  function statusHtml(){
    const eventId=state?.confirmedEventId;
    const booked=((state?.bookings)||[]).filter(b=>b.event_id===eventId&&(b.attendance_status||'booked')==='booked');
    const details=((state?.tripDetails)||[]).filter(r=>r.event_id===eventId);
    const memberName=id=>((state?.members)||[]).find(m=>m.id===id)?.name||'Driver';
    const missingAccommodation=booked.filter(b=>{
      const r=details.find(d=>d.member_id===b.member_id);
      return !r||(!r.night_before&&!r.night_after&&r.accommodation_none!==true);
    });
    const accommodationChoicesDone=booked.length>0&&missingAccommodation.length===0;
    const accommodation=state?.accommodation||{};
    const stayDone=!!(accommodation.location||accommodation.address||accommodation.stay_details);
    const bookedBy=accommodation.updated_by?memberName(accommodation.updated_by):'';
    const trailers=details.filter(r=>r.trailer).length;
    const trailerDone=trailers===0||!!accommodation.parking_notes;
    const missingNames=missingAccommodation.map(b=>memberName(b.member_id));
    const items=[];
    if(accommodationChoicesDone){
      items.push({done:true,text:'Everyone has completed Trip details'});
    }else{
      items.push({done:false,text:missingNames.length<=3?`Trip details needed from ${missingNames.join(', ')}`:`${missingNames.length} drivers still need to complete Trip details`});
    }
    items.push({done:stayDone,text:stayDone?`Accommodation confirmed${bookedBy?` — booked by ${bookedBy}`:''}`:'Accommodation still to sort'});
    if(trailers)items.push({done:trailerDone,text:trailerDone?`Parking noted for ${trailers} trailer${trailers===1?'':'s'}`:`${trailers} trailer${trailers===1?'':'s'} coming — parking needs confirming`});
    const left=items.filter(i=>!i.done).length;
    return `<section class="trip-status-box"><div class="trip-status-head"><strong>TRIP CHECK</strong><span>${left?`${left} LEFT TO SORT`:'ALL SORTED ✓'}</span></div><div class="trip-status-list">${items.map(i=>`<div class="trip-status-item ${i.done?'done':'todo'}"><span class="trip-status-check">${i.done?'✓':''}</span><span>${esc(i.text)}</span></div>`).join('')}</div><div class="trip-status-note">If someone changes their Trip details, this updates for the crew automatically.</div></section>`;
  }
  function enhance(shell){
    if(!shell||shell.dataset.navV2==='1')return;
    const nav=shell.querySelector('.trip-tabs'),homePanel=shell.querySelector('[data-trip-panel="home"]'),tripPanel=shell.querySelector('[data-trip-panel="my-trip"]'),stayPanel=shell.querySelector('[data-trip-panel="stay"]'),oldHome=nav?.querySelector('[data-trip-tab="home"]');
    if(!nav||!homePanel||!tripPanel||!stayPanel||!oldHome)return;
    shell.dataset.navV2='1';
    const hero=homePanel.querySelector('.trip-mode-hero'),track=hero?.querySelector('h1')?.textContent?.trim()||'Track day',date=hero?.querySelector('.trip-mode-date')?.textContent?.trim()||'',countdown=hero?.querySelector('[data-booking-countdown]'),eventDate=countdown?.dataset.bookingCountdown||'';
    const homeWrap=document.createElement('div');homeWrap.className='trip-home-control-wrap';oldHome.className='trip-home-control';oldHome.textContent='HOME';homeWrap.appendChild(oldHome);nav.parentNode.insertBefore(homeWrap,nav);
    const mini=document.createElement('section');mini.className='trip-event-mini';mini.innerHTML=`<div class="trip-event-mini-copy"><span class="eyebrow">🏁 CONFIRMED EVENT</span><h2>${esc(track)}</h2><p>${esc(date)}</p></div><div class="trip-event-mini-count"><strong data-booking-countdown="${eventDate}">${countdown?.childNodes?.[0]?.textContent?.trim()||''}</strong><span>TO GO</span></div>`;nav.parentNode.insertBefore(mini,nav);
    const tripButton=nav.querySelector('[data-trip-tab="my-trip"]');tripButton.textContent='Trip';
    const travelBtn=document.createElement('button');travelBtn.type='button';travelBtn.className='trip-tab';travelBtn.dataset.tripTab='travel';travelBtn.textContent='Travel';nav.appendChild(travelBtn);
    let bingo=shell.querySelector('[data-trip-panel="bingo"]');if(!bingo){bingo=document.createElement('div');bingo.className='trip-panel';bingo.dataset.tripPanel='bingo';bingo.hidden=true;bingo.innerHTML='';shell.appendChild(bingo)}
    const travel=document.createElement('div');travel.className='trip-panel';travel.dataset.tripPanel='travel';travel.hidden=true;travel.innerHTML='<div class="trip-travel" data-travel-content></div>';shell.appendChild(travel);
    const departure=homePanel.querySelector('.departure-card');if(departure)travel.querySelector('[data-travel-content]').appendChild(departure);
    const travelContent=travel.querySelector('[data-travel-content]');travelContent?.insertAdjacentHTML('beforeend','<section class="trip-mode-card"><span class="eyebrow">🧭 NAVIGATION</span><h2>Let’s roll</h2><p class="muted">Pick the next stop and Waze will take it from here.</p><div class="travel-actions"><a class="travel-destination" data-waze-stay target="_blank" rel="noopener">Accommodation</a><a class="travel-destination" data-waze-track target="_blank" rel="noopener">Track</a></div></section>');
    const accommodation=state?.accommodation||{},eventName=track;const waze=q=>'https://www.waze.com/ul?q='+encodeURIComponent(q)+'&navigate=yes';const wa=travel.querySelector('[data-waze-stay]'),wt=travel.querySelector('[data-waze-track]');const stayRoute=accommodation.address||accommodation.location||accommodation.stay_details||'';if(wa){wa.href=waze(stayRoute);wa.classList.toggle('is-unavailable',!stayRoute)}if(wt)wt.href=waze(eventName);
    if(departure){const p=state?.departurePlan||{},saved=!!(p.meet_location&&p.meet_time&&p.departure_time);departure.classList.toggle('tdh-departure-saved',saved);const head=departure.querySelector('.departure-head');if(head&&!head.querySelector('.departure-edit')){const edit=document.createElement('button');edit.type='button';edit.className='departure-edit';edit.textContent='Edit';edit.addEventListener('click',()=>departure.classList.remove('tdh-departure-saved'));head.appendChild(edit)}const form=departure.querySelector('[data-departure-form]');if(form){form.addEventListener('submit',()=>{const place=form.querySelector('[name="meetLocation"]')?.value.trim(),meet=form.querySelector('[name="meetTime"]')?.value,depart=form.querySelector('[name="departureTime"]')?.value;if(place&&meet&&depart)setTimeout(()=>departure.classList.add('tdh-departure-saved'),50)},true)}}
    homePanel.querySelector('.trip-mode-hero')?.insertAdjacentHTML('afterend',statusHtml());
    const allPanels=()=>[...shell.querySelectorAll('[data-trip-panel]')],allTabs=()=>[...nav.querySelectorAll('[data-trip-tab]')];
    function reflect(id){const home=id==='home';shell.classList.toggle('trip-homepage',home);shell.classList.toggle('trip-subpage',!home);oldHome.classList.toggle('active',home);allTabs().forEach(t=>t.classList.toggle('active',!home&&t.dataset.tripTab===id));nav.querySelector('[data-trip-tab="stay"]')?.classList.toggle('tdh-needs-recheck',!!window.__tdhStayNeedsRecheck)}
    function showPanel(id){window.__tdhTripPanel=id;window.__tdhSetBaseTripTab?.(id);allPanels().forEach(p=>p.hidden=p.dataset.tripPanel!==id);reflect(id);window.scrollTo({top:0,behavior:'smooth'})}
    shell.__tdhShowTripPanel=showPanel;
    if(!window.__tdhDirectBingoView)window.__tdhOpenBookedBingo=()=>{window.__tdhTripPanel='bingo';showPanel('bingo');Promise.resolve(window.__tdhRefreshBingo?.()).catch(()=>{});return true};
    travelBtn.addEventListener('click',()=>showPanel('travel'));
    oldHome.addEventListener('click',()=>setTimeout(()=>showPanel('home'),0));
    tripButton.addEventListener('click',()=>setTimeout(()=>showPanel('my-trip'),0));
    nav.querySelector('[data-trip-tab="stay"]').addEventListener('click',()=>setTimeout(()=>showPanel('stay'),0));
    const stayTab=nav.querySelector('[data-trip-tab="stay"]');const reflectRecheck=()=>stayTab?.classList.toggle('tdh-needs-recheck',!!window.__tdhStayNeedsRecheck);reflectRecheck();window.addEventListener('tdh-stay-recheck-state',reflectRecheck);const active=allTabs().find(t=>t.classList.contains('active'))?.dataset.tripTab;
    const wanted=window.__tdhTripPanel;
    showPanel(wanted==='bingo'||wanted==='travel'?wanted:(active||wanted||'home'));
  }
  const observer=new MutationObserver(()=>document.querySelectorAll('.trip-mode-shell').forEach(enhance));observer.observe(document.documentElement,{childList:true,subtree:true});document.querySelectorAll('.trip-mode-shell').forEach(enhance);
})();
