(() => {
  const style=document.createElement('style');
  style.textContent=`
    .guided-next{margin:14px 0 18px;padding:16px;border:1px solid #3c614a;border-radius:18px;background:linear-gradient(145deg,#17251e,#101713);box-shadow:0 14px 36px rgba(0,0,0,.22)}
    .guided-next .eyebrow{color:#72df9e}.guided-next h3{margin:5px 0 5px;font-size:20px}.guided-next p{margin:0 0 13px;color:#aeb9b1;font-size:12px;line-height:1.45}
    .guided-next button{width:100%;min-height:52px;border:1px solid #72df9e!important;background:#72df9e!important;color:#07130c!important;border-radius:14px!important;font-size:14px!important;font-weight:950!important;letter-spacing:.02em!important;box-shadow:0 8px 24px rgba(114,223,158,.18)}
    .trip-tabs.guided-tabs{grid-template-columns:repeat(var(--guided-count,1),minmax(0,1fr))!important}
    .trip-tabs.guided-tabs .trip-tab{min-height:46px;border-radius:13px!important;border-color:#3a454e!important;background:#171d22!important;color:#dbe2e7!important;font-size:12px!important;font-weight:950!important;opacity:1!important}
    .trip-tabs.guided-tabs .trip-tab.active{background:#edf4ef!important;color:#0b110d!important;border-color:#edf4ef!important}
    .trip-tabs.guided-tabs .trip-tab.guided-current:not(.active){border-color:#72df9e!important;color:#72df9e!important;box-shadow:inset 0 0 0 1px rgba(114,223,158,.18)}
    .trip-status-item.todo.guided-todo{color:#f2f5f3;font-weight:800}.trip-status-item.todo.guided-todo .trip-status-check{border-color:#72df9e;box-shadow:0 0 0 2px rgba(114,223,158,.1)}
    .my-trip-save,.add-passenger,.accommodation-edit,.accommodation-form button,.airbnb-link,.trailer-booking-form button,[data-stay-import],[data-stay-edit],[data-stay-save],[data-trailer-booked],[data-trailer-save]{font-weight:950!important}
    .my-trip-save,.accommodation-form button.primary,[data-stay-save],[data-trailer-save]{min-height:50px!important;box-shadow:0 7px 22px rgba(95,208,141,.16)}
    @media(max-width:620px){.guided-next{padding:14px}.trip-tabs.guided-tabs .trip-tab{font-size:11px!important;padding:10px 5px!important}}
  `;
  document.head.appendChild(style);

  const myDetails=()=>((state?.tripDetails)||[]).find(r=>r.event_id===state?.confirmedEventId&&r.member_id===state?.me?.id);
  const localFlexibleStay=()=>{const form=document.querySelector('[data-my-trip-form]');if(!form)return false;return !!form.querySelector('[data-extra-stay-list] .extra-stay-chip')};
  const detailsComplete=()=>{const r=myDetails();return !!r&&!!(r.night_before||r.night_after||r.accommodation_none===true||(Array.isArray(r.stay_dates)&&r.stay_dates.length)||localFlexibleStay())};
  const accommodationConfirmed=()=>{const a=state?.accommodation||{};return !!(a.location||a.address||a.stay_details)};
  const bingoOpen=()=>state?.bingoUnlocked===true;
  let previous={trip:null,stay:null,bingo:null};
  let initialised=false;
  let jumping=false;

  function desired(){
    if(!detailsComplete())return 'my-trip';
    if(!accommodationConfirmed())return 'stay';
    if(bingoOpen())return 'bingo';
    return 'stay';
  }

  function visibleTabs(){
    const out=['my-trip'];
    if(detailsComplete())out.push('stay');
    if(bingoOpen())out.push('travel');
    return out;
  }

  function clickTab(id){const shell=document.querySelector('.trip-mode-shell');if(id==='bingo'){let p=shell?.querySelector('[data-trip-panel="bingo"]');if(!p&&shell){p=document.createElement('div');p.className='trip-panel';p.dataset.tripPanel='bingo';shell.appendChild(p)}shell?.querySelectorAll('[data-trip-panel]').forEach(x=>x.hidden=x!==p);shell?.classList.add('trip-subpage');shell?.classList.remove('trip-homepage');shell?.querySelectorAll('[data-trip-tab]').forEach(x=>x.classList.remove('active'));shell?.querySelector('.trip-home-control')?.classList.remove('active');window.scrollTo({top:0,behavior:'smooth'});window.dispatchEvent(new Event('focus'));return}const btn=shell?.querySelector(`[data-trip-tab="${id}"]`);if(!btn||btn.hidden)return;jumping=true;btn.click();setTimeout(()=>{jumping=false},350)}

  function guideHtml(step){
    if(step==='my-trip')return `<section class="guided-next"><span class="eyebrow">YOUR NEXT STEP</span><h3>Sort your Trip details 🏁</h3><p>Tell the crew about accommodation, passengers and your trailer. Once that’s saved, Stay unlocks.</p><button type="button" data-guided-go="my-trip">SORT MY TRIP →</button></section>`;
    if(step==='stay')return `<section class="guided-next"><span class="eyebrow">NEXT UP</span><h3>Get the stay sorted 🏠</h3><p>Your Trip details are done. Accommodation is the next job — and sorting it unlocks Broken Car Bingo.</p><button type="button" data-guided-go="stay">GO TO STAY →</button></section>`;
    return `<section class="guided-next"><span class="eyebrow">UNLOCKED ✓</span><h3>Broken Car Bingo is ready 🎰</h3><p>The stay is sorted. Time to make your secret prediction.</p><button type="button" data-guided-go="bingo">OPEN BINGO →</button></section>`;
  }

  function apply(){
    const shell=document.querySelector('.trip-mode-shell');
    if(!shell||!state?.me||!state?.confirmedEventId)return;
    const mine=((state?.bookings)||[]).find(b=>b.event_id===state.confirmedEventId&&b.member_id===state.me.id);
    if((mine?.attendance_status||'')!=='booked')return;
    const nav=shell.querySelector('.trip-tabs');
    if(!nav)return;
    const now={trip:detailsComplete(),stay:accommodationConfirmed(),bingo:bingoOpen()};
    const allowed=visibleTabs(),next=desired();
    nav.classList.add('guided-tabs');nav.style.setProperty('--guided-count',String(allowed.length));
    nav.querySelectorAll('[data-trip-tab]').forEach(btn=>{
      const id=btn.dataset.tripTab;
      btn.hidden=!allowed.includes(id);
      btn.classList.toggle('guided-current',id===next);
    });
    const home=shell.querySelector('[data-trip-panel="home"]');
    if(home){
      let guide=home.querySelector('.guided-next');
      const html=guideHtml(next);
      if(!guide){const hero=home.querySelector('.trip-mode-hero');hero?.insertAdjacentHTML('afterend',html);guide=home.querySelector('.guided-next')}
      else if(guide.dataset.step!==next)guide.outerHTML=html;
      guide=home.querySelector('.guided-next');if(guide){guide.dataset.step=next;const go=guide.querySelector('[data-guided-go]');if(go)go.onclick=()=>clickTab(go.dataset.guidedGo||next)}
      home.querySelectorAll('.trip-status-item.todo').forEach((x,i)=>x.classList.toggle('guided-todo',i===0));
    }
    if(initialised&&!jumping){
      if(previous.trip===false&&now.trip===true) setTimeout(()=>clickTab('stay'),120);
      else if(previous.stay===false&&now.stay===true&&now.bingo===true) setTimeout(()=>clickTab('bingo'),120);
      else if(previous.bingo===false&&now.bingo===true) setTimeout(()=>clickTab('bingo'),120);
    }
    previous=now;initialised=true;
  }

  document.addEventListener('click',e=>{
    const save=e.target.closest('.my-trip-save');
    if(save)setTimeout(()=>{apply();if(detailsComplete())clickTab('stay')},700);
  });

  document.addEventListener('click',e=>{const go=e.target.closest?.('[data-guided-go="bingo"]');if(!go)return;e.preventDefault();e.stopImmediatePropagation();clickTab('bingo')},true);
  window.addEventListener('focus',apply);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply()});
  setInterval(apply,650);
  apply();
})();