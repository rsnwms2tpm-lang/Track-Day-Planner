(() => {
  const ENDPOINT='https://uehmbzwnbariqebbxcst.supabase.co/functions/v1/trip-trailer';
  const style=document.createElement('style');
  style.textContent=`
    .trailer-booking-card{margin-top:14px}
    .trailer-booking-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
    .trailer-booking-head h2{margin:4px 0 0;font-size:25px}
    .trailer-booking-pill{flex:none;font-size:10px;font-weight:900;letter-spacing:.11em;padding:7px 10px;border-radius:999px;border:1px solid #35404a;color:#98a4af;background:#151a20}
    .trailer-booking-pill.done{border-color:#356247;background:#15261c;color:#74df9e}
    .trailer-booking-copy{margin:16px 0 0;color:#d2d8df;font-size:13px}
    .trailer-booking-copy strong{display:block;margin-bottom:5px;font-size:15px}
    .trailer-booking-notes{margin-top:13px;padding-top:13px;border-top:1px solid #2b323a;white-space:pre-wrap;color:#cbd3dc}
    .trailer-booking-meta{margin-top:10px;color:#7f8995;font-size:10px;letter-spacing:.06em}
    .trailer-booking-actions{margin-top:14px}
    .trailer-booking-form{display:grid;gap:12px;margin-top:16px;padding-top:16px;border-top:1px solid #2b323a}
    .trailer-booking-form label{display:grid;gap:7px;font-size:12px;font-weight:800;color:#c7cfd8}
    .trailer-booking-form textarea{width:100%;box-sizing:border-box;min-height:92px;resize:vertical}
    .trailer-booking-check{display:flex!important;grid-template-columns:none!important;align-items:center;gap:10px;padding:12px 13px;border:1px solid #2a323b;border-radius:14px;background:#171c22}
    .trailer-booking-check input{width:19px;height:19px;margin:0;accent-color:#61d38f}
    .trailer-booking-buttons{display:flex;gap:10px;flex-wrap:wrap}
    @media(max-width:620px){.trailer-booking-head{align-items:flex-start}.trailer-booking-head h2{font-size:22px}}
  `;
  document.head.appendChild(style);

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let eventKey='';
  let trailerData={booked:false,notes:'',updated_at:null,updated_by_name:''};
  let loading=false;
  let stateSig='';

  function trailerCount(){
    const eventId=state?.confirmedEventId;
    return ((state?.tripDetails)||[]).filter(r=>r.event_id===eventId&&r.trailer).length;
  }

  async function request(method='GET',payload={}){
    if(!session?.groupId||!session?.memberToken||!state?.confirmedEventId)return null;
    if(method==='GET'){
      const q=new URLSearchParams({groupId:session.groupId,token:session.memberToken,eventId:state.confirmedEventId});
      const r=await fetch(`${ENDPOINT}?${q}`);
      const j=await r.json();
      if(!r.ok)throw new Error(j.error||'Could not load trailer booking');
      return j;
    }
    const r=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({groupId:session.groupId,token:session.memberToken,eventId:state.confirmedEventId,...payload})});
    const j=await r.json();
    if(!r.ok)throw new Error(j.error||'Could not save trailer booking');
    return j;
  }

  function cardHtml(){
    const count=trailerCount();
    const d=trailerData||{};
    const status=d.booked?'BOOKED ✓':'TO SORT';
    const meta=d.updated_at?`Updated${d.updated_by_name?` by ${esc(d.updated_by_name)}`:''}`:'';
    return `<section class="trip-mode-card trailer-booking-card" data-trailer-booking-card>
      <div class="trailer-booking-head"><div><span class="eyebrow">TRAILER LOGISTICS</span><h2>🚚 Trailer booking</h2></div><span class="trailer-booking-pill ${d.booked?'done':''}">${status}</span></div>
      <div data-trailer-booking-view>
        <div class="trailer-booking-copy"><strong>${d.booked?'Trailer booking confirmed ✓':'Trailer booking not yet confirmed'}</strong><span>${count} trailer${count===1?'':'s'} currently listed for this trip.</span>${d.notes?`<div class="trailer-booking-notes"><span class="accommodation-label">BOOKING / COLLECTION NOTES</span>${esc(d.notes)}</div>`:''}${meta?`<div class="trailer-booking-meta">${meta}</div>`:''}</div>
        <div class="trailer-booking-actions"><button type="button" class="ghost" data-edit-trailer-booking>${d.booked||d.notes?'Edit trailer booking':'Add trailer booking'}</button></div>
      </div>
      <form class="trailer-booking-form" data-trailer-booking-form hidden>
        <label class="trailer-booking-check"><input type="checkbox" name="booked" ${d.booked?'checked':''}><span>Trailer booking is done / confirmed</span></label>
        <label>Booking / collection notes<textarea name="notes" maxlength="1000" placeholder="e.g. booked with Brian James Hire · collect Sunday 16:00 · £100 deposit · straps included">${esc(d.notes||'')}</textarea></label>
        <div class="trailer-booking-buttons"><button type="submit" class="primary">Save trailer details</button><button type="button" class="ghost" data-cancel-trailer-booking>Cancel</button></div>
      </form>
    </section>`;
  }

  function wire(card){
    const view=card.querySelector('[data-trailer-booking-view]');
    const form=card.querySelector('[data-trailer-booking-form]');
    const edit=card.querySelector('[data-edit-trailer-booking]');
    const cancel=card.querySelector('[data-cancel-trailer-booking]');
    const toggle=on=>{if(view)view.hidden=on;if(form)form.hidden=!on};
    if(edit)edit.onclick=()=>toggle(true);
    if(cancel)cancel.onclick=()=>toggle(false);
    if(form)form.onsubmit=async ev=>{
      ev.preventDefault();
      const btn=form.querySelector('[type="submit"]');
      const fd=new FormData(form);
      btn.disabled=true;btn.textContent='Saving…';
      try{
        const j=await request('POST',{booked:fd.get('booked')==='on',notes:fd.get('notes')});
        trailerData=j.trailerBooking||trailerData;
        renderCard();
        updateTripCheck();
      }catch(err){alert('Could not save trailer booking: '+(err?.message||err));btn.disabled=false;btn.textContent='Save trailer details'}
    };
  }

  function renderCard(){
    document.querySelectorAll('.trip-mode-shell').forEach(shell=>{
      const stay=shell.querySelector('[data-trip-panel="stay"]');
      if(!stay)return;
      stay.querySelector('[data-trailer-booking-card]')?.remove();
      if(trailerCount()===0)return;
      const wrap=document.createElement('div');wrap.innerHTML=cardHtml();
      const card=wrap.firstElementChild;
      const acc=stay.querySelector('.trip-accommodation');
      if(acc)acc.insertAdjacentElement('afterend',card);else stay.appendChild(card);
      wire(card);
    });
  }

  function updateTripCheck(){
    document.querySelectorAll('.trip-mode-shell').forEach(shell=>{
      const box=shell.querySelector('.trip-status-box');
      const list=box?.querySelector('.trip-status-list');
      if(!box||!list)return;
      list.querySelector('[data-trailer-booking-check]')?.remove();
      if(trailerCount()>0){
        [...list.querySelectorAll('.trip-status-item')].forEach(row=>{
          const text=row.textContent||'';
          if(/trailer(s)? coming/i.test(text)&&/parking/i.test(text))row.remove();
        });
        const row=document.createElement('div');
        row.dataset.trailerBookingCheck='1';
        row.className=`trip-status-item ${trailerData.booked?'done':'todo'}`;
        row.innerHTML=`<span class="trip-status-check">${trailerData.booked?'✓':''}</span><span>${trailerData.booked?'Trailer booking confirmed':'Trailer booking still to sort'}</span>`;
        list.appendChild(row);
      }
      const left=list.querySelectorAll('.trip-status-item.todo').length;
      const status=box.querySelector('.trip-status-head span');
      if(status)status.textContent=left?`${left} LEFT TO SORT`:'ALL SORTED ✓';
    });
  }

  async function loadForTrip(){
    const k=`${session?.groupId||''}:${state?.confirmedEventId||''}`;
    if(!state?.confirmedEventId||!session?.memberToken){eventKey='';return}
    if(k===eventKey||loading)return;
    eventKey=k;loading=true;
    try{
      const j=await request('GET');
      trailerData=j?.trailerBooking||{booked:false,notes:'',updated_at:null,updated_by_name:''};
    }catch(err){console.warn('Trailer booking load failed',err)}
    finally{loading=false;renderCard();updateTripCheck()}
  }

  function missingTrailerUi(){
    if(trailerCount()===0)return false;
    return [...document.querySelectorAll('.trip-mode-shell')].some(shell=>{
      const stay=shell.querySelector('[data-trip-panel="stay"]');
      const box=shell.querySelector('.trip-status-box');
      const cardMissing=!!stay&&!stay.querySelector('[data-trailer-booking-card]');
      const checkMissing=!!box&&!box.querySelector('[data-trailer-booking-check]');
      return cardMissing||checkMissing;
    });
  }

  function tick(){
    loadForTrip();
    const sig=`${state?.confirmedEventId||''}|${trailerCount()}|${((state?.tripDetails)||[]).map(r=>`${r.member_id}:${r.trailer?1:0}:${r.updated_at||''}`).join(',')}`;
    if(sig!==stateSig||missingTrailerUi()){
      stateSig=sig;
      renderCard();
      updateTripCheck();
    }
  }

  setInterval(tick,700);
  tick();
})();