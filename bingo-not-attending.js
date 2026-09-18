(() => {
  const ENDPOINT='https://uehmbzwnbariqebbxcst.supabase.co/functions/v1/trip-bingo';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const style=document.createElement('style');
  style.textContent=`
    .bingo-away-launch{margin-top:12px;width:100%;min-height:44px;font-weight:900}
    .bingo-away-overlay{position:fixed;inset:0;z-index:10050;background:#090b0f;overflow:auto;-webkit-overflow-scrolling:touch}
    .bingo-away-shell{width:min(620px,100%);min-height:100vh;margin:0 auto;padding:18px 16px 34px;box-sizing:border-box}
    .bingo-away-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.bingo-away-back{border:1px solid #303941;background:#151a20;color:#fff;border-radius:11px;min-height:42px;padding:0 13px;font-weight:800}.bingo-away-event{text-align:right}.bingo-away-event strong{display:block;font-size:13px}.bingo-away-event span{display:block;color:#89939d;font-size:10px;margin-top:2px}
    .bingo-away-hero{padding:18px!important;background:linear-gradient(145deg,#19151f,#101318)!important;border-color:#392d42!important;margin-bottom:12px}.bingo-away-hero h2{margin:5px 0 6px;font-size:27px}.bingo-away-hero p{margin:0;color:#a8a0ae;font-size:12px;line-height:1.5}.bingo-away-state{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px;padding:11px 12px;border:1px solid #3b3342;border-radius:13px;background:#121116}.bingo-away-state strong{font-size:11px;letter-spacing:.1em}.bingo-away-state span{font-size:10px;color:#9c91a4;text-align:right;line-height:1.35}
    .bingo-away-timing{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}.bingo-away-time{padding:11px 12px!important}.bingo-away-time span{display:block;font-size:9px;font-weight:900;letter-spacing:.11em;color:#7f8995}.bingo-away-time strong{display:block;margin-top:4px;font-size:13px}.bingo-away-time.done strong{color:#72df9e}
    .bingo-away-note{border:1px solid #3b3342;background:#15111a;border-radius:14px;padding:12px 13px;color:#b6aabd;font-size:12px;line-height:1.5;margin-bottom:12px}
    .bingo-away-form{border:1px solid #2b3239;background:#11151a;border-radius:16px;padding:15px}.bingo-away-form h3{margin:3px 0 8px}.bingo-away-form label{display:block;margin:10px 0 5px;font-size:9px;font-weight:900;letter-spacing:.12em;color:#89939d}.bingo-away-form select,.bingo-away-form input{width:100%;box-sizing:border-box;min-height:44px;border:1px solid #303941;border-radius:12px;background:#0e1216;color:#f4f7f5;padding:10px 12px;font:inherit}.bingo-away-form button{width:100%;margin-top:12px}.bingo-away-saved{text-align:center;color:#72df9e;font-size:10px;margin-top:8px}.bingo-away-locked{text-align:center;padding:28px 16px!important}.bingo-away-locked h3{margin:6px 0}.bingo-away-locked p{color:#929da8;margin:0;line-height:1.5}.bingo-away-reveal{padding:15px!important}.bingo-away-reveal h3{margin:3px 0 12px}.bingo-away-reveal-row{padding:11px 0;border-top:1px solid #293039}.bingo-away-reveal-row:first-of-type{border-top:0}.bingo-away-reveal-row strong{display:block}.bingo-away-reveal-row span{display:block;margin-top:3px;color:#a7b0b9;font-size:11px}.bingo-away-bailed{color:#d7a86e!important}.bingo-away-secret{padding:13px 15px!important;color:#9ca6af;font-size:11px;line-height:1.5;margin-bottom:12px}.bingo-away-secret strong{color:#f2f4f5}
  `;
  document.head.appendChild(style);

  let awayState=null;
  let awayLoading=false;
  let awayTimer=null;

  const myBooking=()=>((state?.bookings)||[]).find(b=>b.event_id===state?.confirmedEventId&&b.member_id===state?.me?.id);
  const memberName=id=>((state?.members)||[]).find(m=>m.id===id)?.name||'Driver';

  function eventMeta(){
    const id=String(state?.confirmedEventId||'');
    const date=id.match(/\d{4}-\d{2}-\d{2}/)?.[0]||'';
    const venue=id.toLowerCase().includes('castle-combe')?'Castle Combe':(id.split('-').slice(4).join(' ').replace(/\b\w/g,c=>c.toUpperCase())||'Confirmed track day');
    let pretty=date;
    if(date){try{pretty=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric'}).format(new Date(`${date}T12:00:00Z`))}catch{}}
    return {venue,pretty};
  }

  async function secureRequest(method='GET',payload={}){
    if(!session?.groupId||!session?.memberToken||!state?.confirmedEventId)return null;
    if(method==='GET'){
      const q=new URLSearchParams({action:'status',groupId:session.groupId,token:session.memberToken,eventId:state.confirmedEventId});
      const r=await fetch(`${ENDPOINT}?${q}`,{cache:'no-store'});const j=await r.json();if(!r.ok)throw new Error(j.error||'Could not load Bingo');return j;
    }
    const r=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({groupId:session.groupId,token:session.memberToken,eventId:state.confirmedEventId,...payload})});
    const j=await r.json();if(!r.ok)throw new Error(j.error||'Could not update Bingo');return j;
  }

  function subjects(){return (awayState?.subjects||[]).filter(b=>b.car_snapshot).map(b=>({id:b.member_id,name:memberName(b.member_id),car:b.car_snapshot,bailed:(b.attendance_status||'booked')!=='booked'}));}
  function myPrediction(){return (awayState?.predictions||[]).find(p=>p.player_key===`member:${state?.me?.id}`);}

  async function refreshAway(force=false){
    const overlay=document.querySelector('[data-bingo-away-overlay]');
    if(!overlay||awayLoading)return;
    const active=document.activeElement;
    if(!force&&active&&overlay.contains(active)&&active.matches('input,select'))return;
    awayLoading=true;
    try{awayState=await secureRequest('GET');if(forcedOpen&&window.__tdhGetBingoState){const live=window.__tdhGetBingoState();if(live)awayState=live}renderStandalone();}
    catch(e){console.warn('Away Bingo refresh failed',e)}
    finally{awayLoading=false}
  }

  async function savePrediction(){
    const overlay=document.querySelector('[data-bingo-away-overlay]');if(!overlay)return;
    const subject=overlay.querySelector('[data-away-subject]')?.value||'';
    const failure=overlay.querySelector('[data-away-failure]')?.value.trim()||'';
    const save=overlay.querySelector('[data-away-save]');
    if(!subject||!failure){alert('Pick a car and tell us what is going to break 😁');return}
    save.disabled=true;save.textContent='LOCKING IT IN…';
    try{await secureRequest('POST',{action:'save-prediction',playerKey:`member:${state.me.id}`,subjectMemberId:subject,predictedFailure:failure});await refreshAway(true)}
    catch(e){alert(e.message||'Could not save prediction');save.disabled=false;save.textContent='Lock in prediction 🎯'}
  }

  function contentHtml(){
    if(!awayState)return '<section class="trip-mode-card bingo-away-locked"><h3>Loading Bingo…</h3></section>';
    if(!awayState.unlocked)return '<section class="trip-mode-card bingo-away-locked"><span class="eyebrow">BINGO LOCKED 🔒</span><h3>Accommodation first 😏</h3><p>You’re not attending, but you’re still in the game. As soon as the crew sorts the stay, Bingo opens here too.</p></section>';
    if(awayState.timing?.revealed){
      const preds=awayState.predictions||[];
      return `<section class="trip-mode-card bingo-away-reveal"><span class="eyebrow">🎉 20:00 REVEAL</span><h3>The cards are on the table.</h3>${preds.length?preds.map(p=>{const subj=subjects().find(s=>s.id===p.subject_member_id);return `<div class="bingo-away-reveal-row"><strong>${esc(p.player_name)}</strong><span>picked <b>${esc(memberName(p.subject_member_id))} — ${esc(p.subject_car)}</b>${subj?.bailed?' <b class="bingo-away-bailed">· BAILED</b>':''}</span><span>Prediction: ${esc(p.predicted_failure)}</span></div>`}).join(''):'<p class="muted">Nobody got a prediction in this time.</p>'}</section>`;
    }
    const pred=myPrediction(),cars=subjects(),locked=!!awayState.timing?.locked;
    if(locked)return `<section class="trip-mode-card bingo-away-secret"><strong>🤫 Predictions are locked.</strong> Nobody sees the picks until 20:00.</section><section class="trip-mode-card bingo-away-locked"><span class="eyebrow">YOUR PREDICTION</span><h3>${pred?'Safely locked in ✓':'No prediction entered'}</h3><p>${pred?'Your pick stays hidden until the crew reveal.':'The 19:00 deadline has passed for this trip.'}</p></section>`;
    return `<section class="trip-mode-card bingo-away-note"><strong>Not going? Still in the game. 🎰</strong><br>Your attendance stays as Not Attending. This screen is just your Broken Car Bingo access.</section><section class="trip-mode-card bingo-away-secret"><strong>🤫 Completely secret.</strong> Change your prediction as often as you like before 19:00 the night before. No clues or percentages are shown.</section><section class="trip-mode-card bingo-away-form"><span class="eyebrow">YOUR PREDICTION</span><h3>One shot. Make it count.</h3><label>WHO'S GOING TO BREAK IT?</label><select data-away-subject><option value="">Choose your victim…</option>${cars.map(c=>`<option value="${esc(c.id)}" ${pred?.subject_member_id===c.id?'selected':''}>${esc(c.name)} — ${esc(c.car)}${c.bailed?' · BAILED':''}</option>`).join('')}</select><label>WHAT'S GOING WRONG?</label><input data-away-failure maxlength="120" value="${esc(pred?.predicted_failure||'')}" placeholder="Power steering pump 😂"><button type="button" class="primary" data-away-save>${pred?'Change prediction':'Lock in prediction'} 🎯</button>${pred?'<div class="bingo-away-saved">Prediction saved ✓ · still secret</div>':''}</section>`;
  }

  function renderStandalone(){
    const overlay=document.querySelector('[data-bingo-away-overlay]');if(!overlay)return;
    const body=overlay.querySelector('[data-away-body]');if(!body)return;
    const meta=eventMeta();
    const openCopy=awayState?.unlocked?(awayState?.unlockedReason==='no_accommodation_needed'?'No stay needed — game on.':'Accommodation sorted — game on.'):'Waiting for accommodation.';
    body.innerHTML=`<div class="bingo-away-top"><button type="button" class="bingo-away-back" data-away-close>← View Planning</button><div class="bingo-away-event"><strong>${esc(meta.venue)}</strong><span>${esc(meta.pretty)}</span></div></div><section class="trip-mode-card bingo-away-hero"><span class="eyebrow">🎰 BROKEN CAR BINGO</span><h2>Pick your victim.</h2><p>You might not be going, but you can absolutely still predict somebody else’s mechanical misery. 😂</p><div class="bingo-away-state"><strong>${awayState?.unlocked?'BINGO IS OPEN ✓':'BINGO LOCKED 🔒'}</strong><span>${esc(openCopy)}</span></div></section><div class="bingo-away-timing"><section class="trip-mode-card bingo-away-time ${awayState?.timing?.locked?'done':''}"><span>PREDICTIONS LOCK</span><strong>${awayState?.timing?.locked?'LOCKED ✓':esc(awayState?.timing?.lockAt||'19:00 night before')}</strong></section><section class="trip-mode-card bingo-away-time ${awayState?.timing?.revealed?'done':''}"><span>CREW REVEAL</span><strong>${awayState?.timing?.revealed?'REVEALED ✓':esc(awayState?.timing?.revealAt||'20:00 night before')}</strong></section></div>${contentHtml()}`;
    body.querySelector('[data-away-close]')?.addEventListener('click',closeStandalone);
    body.querySelector('[data-away-save]')?.addEventListener('click',savePrediction);
  }

  function closeStandalone(){
    forcedOpen=false;
    document.querySelector('[data-bingo-away-overlay]')?.remove();
    if(awayTimer){clearInterval(awayTimer);awayTimer=null}
    awayState=null;
  }

  function openStandalone(){
    closeStandalone();
    forcedOpen=true;
    const overlay=document.createElement('div');overlay.className='bingo-away-overlay';overlay.dataset.bingoAwayOverlay='1';overlay.innerHTML='<div class="bingo-away-shell" data-away-body></div>';
    document.body.appendChild(overlay);
    renderStandalone();
    refreshAway(true);
    awayTimer=setInterval(()=>refreshAway(false),4000);
  }

  function scan(){
    if(!state?.confirmedEventId||!state?.me)return;
    const mine=myBooking();
    const shouldShow=mine?.attendance_status==='not_attending';
    document.querySelectorAll('[data-bingo-away-launch]').forEach(x=>{if(!shouldShow)x.remove()});
    if(!shouldShow){if(!forcedOpen)closeStandalone();return}
    document.querySelectorAll('.confirmed-booking-card').forEach(card=>{
      if(card.querySelector('[data-bingo-away-launch]'))return;
      const btn=document.createElement('button');btn.type='button';btn.className='ghost bingo-away-launch';btn.dataset.bingoAwayLaunch='1';btn.textContent=state.bingoUnlocked?'🎰 Play Broken Car Bingo':'🎰 Bingo opens after accommodation';btn.onclick=openStandalone;card.appendChild(btn);
    });
  }

  window.__tdhOpenBingoStandalone=openStandalone;
  window.addEventListener('focus',()=>refreshAway(true));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshAway(true)});
  setInterval(scan,700);scan();
})();