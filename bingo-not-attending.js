(() => {
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const style=document.createElement('style');
  style.textContent=`
    .bingo-away-launch{margin-top:12px;width:100%;min-height:44px;font-weight:900}
    .bingo-away-overlay{position:fixed;inset:0;z-index:10050;background:rgba(5,7,9,.88);backdrop-filter:blur(8px);display:grid;place-items:center;padding:16px}
    .bingo-away-modal{width:min(560px,100%);max-height:88vh;overflow:auto;border:1px solid #352d3c;border-radius:22px;background:#0d1014;padding:18px;box-shadow:0 30px 90px rgba(0,0,0,.55)}
    .bingo-away-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}.bingo-away-head h2{margin:4px 0 0;font-size:25px}.bingo-away-close{flex:none;border:1px solid #303941;background:#151a20;color:#fff;border-radius:10px;min-width:40px;min-height:40px}
    .bingo-away-note{border:1px solid #3b3342;background:#15111a;border-radius:14px;padding:12px 13px;color:#b6aabd;font-size:12px;line-height:1.5;margin-bottom:12px}
    .bingo-away-form{border:1px solid #2b3239;background:#11151a;border-radius:16px;padding:14px}.bingo-away-form label{display:block;margin:10px 0 5px;font-size:9px;font-weight:900;letter-spacing:.12em;color:#89939d}.bingo-away-form select,.bingo-away-form input{width:100%;box-sizing:border-box;min-height:44px;border:1px solid #303941;border-radius:12px;background:#0e1216;color:#f4f7f5;padding:10px 12px;font:inherit}.bingo-away-form button{width:100%;margin-top:12px}.bingo-away-saved{text-align:center;color:#72df9e;font-size:10px;margin-top:8px}
    .bingo-away-locked{text-align:center;padding:24px 10px;color:#929da8}.bingo-away-locked h3{color:#fff;margin:5px 0 7px}
  `;
  document.head.appendChild(style);

  const myBooking=()=>((state?.bookings)||[]).find(b=>b.event_id===state?.confirmedEventId&&b.member_id===state?.me?.id);
  const memberName=id=>((state?.members)||[]).find(m=>m.id===id)?.name||'Driver';
  const subjects=()=>((state?.bookings)||[]).filter(b=>b.event_id===state?.confirmedEventId&&b.car_snapshot).map(b=>({id:b.member_id,name:memberName(b.member_id),car:b.car_snapshot,bailed:(b.attendance_status||'booked')!=='booked'}));
  const myPrediction=()=>((state?.bingoPredictions)||[]).find(p=>p.event_id===state?.confirmedEventId&&p.player_key===`member:${state?.me?.id}`);

  function modalHtml(){
    const pred=myPrediction(),cars=subjects();
    if(!state?.bingoUnlocked)return `<div class="bingo-away-locked"><span class="eyebrow">BINGO LOCKED 🔒</span><h3>Not open yet</h3><p>As soon as the accommodation is sorted, you can still play even though you’re not attending.</p></div>`;
    return `<div class="bingo-away-note"><strong>Not going? Still in the game. 🎰</strong><br>Your attendance stays as Not Attending. This only gives you your one Broken Car Bingo prediction.</div><div class="bingo-away-form"><span class="eyebrow">YOUR PREDICTION</span><label>WHO'S GOING TO BREAK IT?</label><select data-away-subject><option value="">Choose your victim…</option>${cars.map(c=>`<option value="${esc(c.id)}" ${pred?.subject_member_id===c.id?'selected':''}>${esc(c.name)} — ${esc(c.car)}${c.bailed?' · BAILED':''}</option>`).join('')}</select><label>WHAT'S GOING WRONG?</label><input data-away-failure maxlength="120" value="${esc(pred?.predicted_failure||'')}" placeholder="Power steering pump 😂"><button type="button" class="primary" data-away-save>${pred?'Change prediction':'Lock in prediction'} 🎯</button>${pred?'<div class="bingo-away-saved">Prediction saved ✓ · still secret</div>':''}</div>`;
  }

  function openModal(){
    document.querySelector('[data-bingo-away-overlay]')?.remove();
    const overlay=document.createElement('div');overlay.className='bingo-away-overlay';overlay.dataset.bingoAwayOverlay='1';overlay.innerHTML=`<section class="bingo-away-modal"><div class="bingo-away-head"><div><span class="eyebrow">🎰 BROKEN CAR BINGO</span><h2>Pick your victim.</h2></div><button type="button" class="bingo-away-close" data-away-close>✕</button></div>${modalHtml()}</section>`;
    document.body.appendChild(overlay);
    overlay.querySelector('[data-away-close]')?.addEventListener('click',()=>overlay.remove());
    overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});
    const save=overlay.querySelector('[data-away-save]');
    if(save)save.addEventListener('click',async()=>{
      const subject=overlay.querySelector('[data-away-subject]')?.value||'';
      const failure=overlay.querySelector('[data-away-failure]')?.value.trim()||'';
      if(!subject||!failure){alert('Pick a car and tell us what is going to break 😁');return}
      save.disabled=true;save.textContent='LOCKING IT IN…';
      try{
        await api('save-bingo-prediction','POST',{groupId:session.groupId,token:session.memberToken,eventId:state.confirmedEventId,playerKey:`member:${state.me.id}`,subjectMemberId:subject,predictedFailure:failure});
        await loadGroup();
        openModal();
      }catch(e){alert(e.message||'Could not save prediction');save.disabled=false;save.textContent='Lock in prediction 🎯'}
    });
  }

  function scan(){
    if(!state?.confirmedEventId||!state?.me)return;
    const mine=myBooking();
    const shouldShow=mine?.attendance_status==='not_attending';
    document.querySelectorAll('[data-bingo-away-launch]').forEach(x=>{if(!shouldShow)x.remove()});
    if(!shouldShow)return;
    document.querySelectorAll('.confirmed-booking-card').forEach(card=>{
      if(card.querySelector('[data-bingo-away-launch]'))return;
      const btn=document.createElement('button');btn.type='button';btn.className='ghost bingo-away-launch';btn.dataset.bingoAwayLaunch='1';btn.textContent=state.bingoUnlocked?'🎰 Play Broken Car Bingo':'🎰 Bingo opens after accommodation';btn.onclick=openModal;
      card.appendChild(btn);
    });
  }
  setInterval(scan,700);scan();
})();