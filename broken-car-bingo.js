(() => {
  const ENDPOINT='https://uehmbzwnbariqebbxcst.supabase.co/functions/v1/trip-bingo';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const style=document.createElement('style');
  style.textContent=`
    .bingo-shell{display:grid;gap:12px}.bingo-hero{padding:18px!important;background:linear-gradient(145deg,#19151f,#101318)!important;border-color:#392d42!important}.bingo-hero h2{margin:5px 0 6px;font-size:25px}.bingo-hero p{margin:0;color:#a8a0ae;font-size:12px;line-height:1.5}
    .bingo-state{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:15px;padding:11px 12px;border:1px solid #3b3342;border-radius:13px;background:#121116}.bingo-state strong{font-size:11px;letter-spacing:.11em}.bingo-state span{font-size:10px;color:#9c91a4;text-align:right;line-height:1.35}
    .bingo-timing{display:grid;grid-template-columns:1fr 1fr;gap:8px}.bingo-time{padding:11px 12px!important}.bingo-time span{display:block;font-size:9px;font-weight:900;letter-spacing:.11em;color:#7f8995}.bingo-time strong{display:block;margin-top:4px;font-size:13px}.bingo-time.done strong{color:#72df9e}
    .bingo-player{padding:15px!important}.bingo-player-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:12px}.bingo-player-head h3{margin:2px 0 0;font-size:18px}.bingo-shot{font-size:9px;font-weight:900;letter-spacing:.12em;color:#72df9e}
    .bingo-player label{display:block;margin:10px 0 5px;font-size:9px;font-weight:900;letter-spacing:.12em;color:#89939d}.bingo-player select,.bingo-player input{box-sizing:border-box;width:100%;min-height:44px;border:1px solid #303941;border-radius:12px;background:#0e1216;color:#f4f7f5;padding:10px 12px;font:inherit}.bingo-player input::placeholder{color:#65707a}.bingo-save{margin-top:11px;width:100%}.bingo-saved{margin-top:8px;color:#72df9e;font-size:10px;text-align:center}.bingo-locked-card{text-align:center;padding:28px 18px!important}.bingo-locked-card h3{margin:6px 0}.bingo-locked-card p{color:#929da8;margin:0;line-height:1.5}.bingo-secret{padding:13px 15px!important;color:#9ca6af;font-size:11px;line-height:1.5}.bingo-secret strong{color:#f2f4f5}.bingo-reveal{padding:15px!important}.bingo-reveal h3{margin:3px 0 12px}.bingo-reveal-row{padding:11px 0;border-top:1px solid #293039}.bingo-reveal-row:first-of-type{border-top:0}.bingo-reveal-row strong{display:block}.bingo-reveal-row span{display:block;margin-top:3px;color:#a7b0b9;font-size:11px}.bingo-bailed{color:#d7a86e!important}.bingo-noacc{padding:15px!important}.bingo-noacc h3{margin:3px 0 5px}.bingo-noacc p{margin:0 0 12px;color:#9aa4ae;font-size:11px;line-height:1.45}.bingo-noacc button{width:100%}.bingo-wait{font-size:10px;color:#7f8995;text-align:center;margin-top:8px}
    body.bingo-direct-open{overflow:hidden}
    .bingo-direct-view{position:fixed;inset:0;z-index:10900;overflow:auto;background:#080a0d;color:#f2f5f3;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}
    .bingo-direct-view[hidden]{display:none!important}
    .bingo-direct-wrap{width:min(760px,100%);min-height:100%;margin:0 auto;padding:0 15px 48px;box-sizing:border-box}
    .bingo-direct-top{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 -15px 14px;padding:13px 15px;border-bottom:1px solid #242b32;background:rgba(8,10,13,.96);backdrop-filter:blur(12px)}
    .bingo-direct-top button{min-height:40px;padding:8px 12px;border:1px solid #39424a;border-radius:12px;background:#151a1f;color:#f2f5f3;font-weight:900}
    .bingo-direct-top strong{font-size:11px;letter-spacing:.13em;color:#dba6ef}
    .bingo-direct-panel{display:block}.bingo-direct-loading{padding:30px 18px!important;text-align:center;color:#a7b0b9}
    .bingo-direct-error{padding:25px 18px!important;text-align:center}.bingo-direct-error h3{margin:5px 0 7px}.bingo-direct-error p{margin:0;color:#a7b0b9;font-size:12px;line-height:1.5}.bingo-direct-error button{width:100%;margin-top:16px}
  `;
  document.head.appendChild(style);

  let bingo=null;
  let loadingPromise=null;
  let eventKey='';
  let lastRenderSig='';

  function booking(memberId){return (state?.bookings||[]).find(b=>b.event_id===state.confirmedEventId&&b.member_id===memberId)}
  function memberName(id){return (state?.members||[]).find(m=>m.id===id)?.name||'Driver'}
  function subjectRows(){
    const source=bingo?.subjects||[];
    return source.filter(b=>b.car_snapshot).map(b=>({id:b.member_id,name:memberName(b.member_id),car:b.car_snapshot,bailed:(b.attendance_status||'booked')!=='booked'}));
  }
  function players(){
    const out=[{key:`member:${state.me.id}`,name:state.me.name,type:'member'}];
    const mine=booking(state.me.id);
    if((mine?.attendance_status||'')==='booked'){
      const detail=(state.tripDetails||[]).find(r=>r.event_id===state.confirmedEventId&&r.member_id===state.me.id);
      (detail?.passenger_names||[]).forEach((name,i)=>out.push({key:`passenger:${state.me.id}:${i}`,name:name||`Passenger ${i+1}`,type:'passenger'}));
    }
    return out;
  }
  function prediction(key){return (bingo?.predictions||[]).find(p=>p.player_key===key)}

  async function request(method='GET',payload={}){
    if(!session?.groupId||!session?.memberToken||!state?.confirmedEventId)return null;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
    let r;
    try{
      if(method==='GET'){
        const q=new URLSearchParams({action:'status',groupId:session.groupId,token:session.memberToken,eventId:state.confirmedEventId});
        r=await fetch(`${ENDPOINT}?${q}`,{cache:'no-store',signal:controller.signal});
      }else{
        r=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},signal:controller.signal,body:JSON.stringify({groupId:session.groupId,token:session.memberToken,eventId:state.confirmedEventId,...payload})});
      }
    }catch(e){if(e?.name==='AbortError')throw new Error('Bingo took too long to respond');throw e}
    finally{clearTimeout(timer)}
    const j=await r.json();if(!r.ok)throw new Error(j.error||`Could not ${method==='GET'?'load':'update'} Bingo`);return j;
  }

  function ensureDirectView(){
    let view=document.querySelector('#tdhBookedBingoView');
    if(view)return view;
    view=document.createElement('section');
    view.id='tdhBookedBingoView';view.className='bingo-direct-view';view.hidden=true;
    view.innerHTML=`<div class="bingo-direct-wrap"><header class="bingo-direct-top"><button type="button" data-close-booked-bingo>← TRIP</button><strong>BROKEN CAR BINGO 🎰</strong></header><main class="trip-panel bingo-direct-panel" data-trip-panel="bingo" data-direct-booked-bingo><section class="trip-mode-card bingo-direct-loading">Loading Bingo…</section></main></div>`;
    document.body.appendChild(view);
    view.querySelector('[data-close-booked-bingo]').onclick=closeDirectView;
    return view;
  }
  function panel(){return document.querySelector('#tdhBookedBingoView [data-direct-booked-bingo]')||document.querySelector('.trip-mode-shell > [data-trip-panel="bingo"]')||document.querySelector('.trip-mode-shell [data-trip-panel="bingo"]')}
  function showLoading(){const p=panel();if(p)p.innerHTML='<section class="trip-mode-card bingo-direct-loading">Loading Bingo…</section>'}
  function showLoadError(error){
    const view=document.querySelector('#tdhBookedBingoView'),p=panel();if(!view||view.hidden||!p)return;
    p.innerHTML=`<section class="trip-mode-card bingo-direct-error"><span class="eyebrow">BINGO DIDN'T LOAD</span><h3>Give it another go.</h3><p>${esc(error?.message||'The Bingo service did not respond.')}</p><button type="button" class="primary" data-retry-bingo>TRY AGAIN →</button></section>`;
    p.querySelector('[data-retry-bingo]').onclick=()=>{showLoading();refresh(true)};
  }
  function closeDirectView(){
    const view=document.querySelector('#tdhBookedBingoView');if(view)view.hidden=true;
    document.body.classList.remove('bingo-direct-open');
    window.__tdhTripPanel='home';window.__tdhSetBaseTripTab?.('home');
    document.querySelector('.trip-mode-shell')?.__tdhShowTripPanel?.('home');
  }
  function openDirectView(){
    const mine=(state?.bookings||[]).find(b=>b.event_id===state?.confirmedEventId&&b.member_id===state?.me?.id);
    if(!state?.confirmedEventId||!state?.me||(mine?.attendance_status||'')!=='booked')return false;
    const view=ensureDirectView();view.hidden=false;document.body.classList.add('bingo-direct-open');
    window.__tdhTripPanel='bingo';window.__tdhSetBaseTripTab?.('bingo');view.scrollTop=0;
    if(bingo)render(true);else showLoading();
    refresh(true);return true;
  }
  function activeEdit(){const p=panel();const a=document.activeElement;return !!(p&&a&&p.contains(a)&&a.matches('input,select,textarea'))}

  async function refresh(force=false){
    const key=`${session?.groupId||''}:${state?.confirmedEventId||''}`;
    if(!state?.confirmedEventId||!session?.memberToken){bingo=null;eventKey='';showLoadError(new Error('Bingo session unavailable'));return null}
    if(loadingPromise)return loadingPromise;
    if(!force&&activeEdit())return;
    loadingPromise=(async()=>{
      try{
        const next=await request('GET');if(!next)throw new Error('Bingo session unavailable');
        bingo=next;window.__tdhBingoApiUnlocked=!!bingo.unlocked;
        if(bingo.unlocked&&state){state.bingoUnlocked=true;if(bingo.unlockedAt)state.bingoUnlockedAt=bingo.unlockedAt}
        eventKey=key;lastRenderSig='';render(true);return bingo;
      }catch(e){console.warn('Bingo refresh failed',e);showLoadError(e);return null}
      finally{loadingPromise=null}
    })();
    return loadingPromise;
  }

  async function savePrediction(player,card){
    const subject=card.querySelector('[data-bingo-subject]')?.value||'';
    const failure=card.querySelector('[data-bingo-failure]')?.value.trim()||'';
    const button=card.querySelector('[data-bingo-save]');
    if(!subject||!failure){alert('Pick a car and tell us what is going to break 😁');return}
    button.disabled=true;button.textContent='LOCKING IT IN…';
    try{await request('POST',{action:'save-prediction',playerKey:player.key,subjectMemberId:subject,predictedFailure:failure});await refresh(true)}
    catch(e){alert(e.message||'Could not save prediction');button.disabled=false;button.textContent='Lock in prediction 🎯'}
  }

  async function noAccommodation(){
    const button=panel()?.querySelector('[data-no-accommodation-needed]');
    if(button){button.disabled=true;button.textContent='CHECKING CREW…'}
    try{await request('POST',{action:'set-no-accommodation',enabled:true});await loadGroup();await refresh(true)}
    catch(e){alert(e.message||'Could not confirm no accommodation needed');if(button){button.disabled=false;button.textContent='Confirm no accommodation needed ✓'}}
  }

  function playerCard(player){
    const pred=prediction(player.key),cars=subjectRows(),locked=!!bingo?.timing?.locked;
    const el=document.createElement('section');el.className='trip-mode-card bingo-player';
    if(locked){
      el.innerHTML=`<div class="bingo-player-head"><div><span class="eyebrow">${player.type==='member'?'YOUR PREDICTION':'PASSENGER PREDICTION'}</span><h3>${esc(player.name)}</h3></div><span class="bingo-shot">LOCKED 🔒</span></div>${pred?`<div class="bingo-saved">Prediction safely locked in ✓</div>`:`<div class="bingo-wait">No prediction was entered before departure.</div>`}`;
      return el;
    }
    el.innerHTML=`<div class="bingo-player-head"><div><span class="eyebrow">${player.type==='member'?'YOUR PREDICTION':'PASSENGER PREDICTION'}</span><h3>${esc(player.name)}</h3></div><span class="bingo-shot">1 SHOT</span></div><label>WHO'S GOING TO BREAK IT?</label><select data-bingo-subject><option value="">Choose your victim…</option>${cars.map(c=>`<option value="${esc(c.id)}" ${pred?.subject_member_id===c.id?'selected':''}>${esc(c.name)} — ${esc(c.car)}${c.bailed?' · BAILED':''}</option>`).join('')}</select><label>WHAT'S GOING WRONG?</label><input data-bingo-failure maxlength="120" value="${esc(pred?.predicted_failure||'')}" placeholder="Power steering pump 😂"><button class="primary bingo-save" data-bingo-save>${pred?'Change prediction':'Lock in prediction'} 🎯</button>${pred?'<div class="bingo-saved">Prediction saved ✓ · still secret</div>':''}`;
    el.querySelector('[data-bingo-save]').onclick=()=>savePrediction(player,el);return el;
  }

  function lockedCopy(){
    if(bingo?.gatePhase==='waiting_attendance') return {title:'Waiting for attendance.',text:`${bingo.unresolvedExpectedCount||0} of the original Yes crew still need to choose Booked or Not Attending.`};
    if(bingo?.gatePhase==='waiting_accommodation_answers') return {title:'Waiting for everyone’s stay answer.',text:`${bingo.unansweredBookedCount||0} booked driver${bingo.unansweredBookedCount===1?'':'s'} still need to say whether they need accommodation.`};
    if(bingo?.gatePhase==='waiting_accommodation_booking') return {title:'Accommodation first 😏',text:'At least one booked driver needs a stay. Bingo opens once the accommodation details are confirmed.'};
    return {title:'Trip details still to sort.',text:'Bingo will open once attendance and accommodation are settled.'};
  }

  function render(force=false){
    const p=panel();if(!p||!state?.me||!bingo)return;
    const sig=JSON.stringify({event:state.confirmedEventId,unlocked:bingo.unlocked,resolved:bingo.resolvedAttendance,status:bingo.attendanceStatus,timing:bingo.timing,preds:bingo.predictions,subjects:bingo.subjects,phase:bingo.gatePhase,unresolved:bingo.unresolvedExpectedCount,unanswered:bingo.unansweredBookedCount,needs:bingo.anyoneNeedsAccommodation,canNoAcc:bingo.canConfirmNoAccommodation});
    if(!force&&sig===lastRenderSig&&p.dataset.bingoSecure==='1')return;
    if(activeEdit())return;
    lastRenderSig=sig;p.dataset.bingoSecure='1';p.innerHTML='';
    const wrap=document.createElement('div');wrap.className='bingo-shell';
    const hero=document.createElement('section');hero.className='trip-mode-card bingo-hero';
    const openCopy=bingo.unlocked?(bingo.unlockedReason==='no_accommodation_needed'?'No stay needed — game on.':'Accommodation sorted — game on.'):'Attendance and accommodation still to settle.';
    hero.innerHTML=`<span class="eyebrow">🎰 BROKEN CAR BINGO</span><h2>Pick your victim.</h2><p>One person. One car. One predicted mechanical demise. Nobody else sees your prediction until the post-track Results game. 😂</p><div class="bingo-state"><strong>${bingo.unlocked?'BINGO IS OPEN ✓':'BINGO LOCKED 🔒'}</strong><span>${openCopy}</span></div>`;wrap.appendChild(hero);
    const timing=document.createElement('div');timing.className='bingo-timing';timing.innerHTML=`<section class="trip-mode-card bingo-time ${bingo.timing?.locked?'done':''}"><span>PREDICTIONS LOCK</span><strong>${bingo.timing?.locked?'LOCKED ✓':esc(bingo.timing?.lockAt?new Date(bingo.timing.lockAt).toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'Set departure time')}</strong></section><section class="trip-mode-card bingo-time"><span>RESULTS REVEAL</span><strong>AFTER THE TRACK DAY</strong></section>`;wrap.appendChild(timing);

    if(!bingo.unlocked){
      if(bingo.canConfirmNoAccommodation){
        const c=document.createElement('section');c.className='trip-mode-card bingo-noacc';c.innerHTML='<span class="eyebrow">NO BEDS REQUIRED</span><h3>Everyone’s resolved — nobody needs accommodation.</h3><p>All of the original Yes crew have resolved attendance and every booked driver has answered their stay requirement. Confirm no accommodation is needed and Bingo opens.</p><button class="primary" data-no-accommodation-needed>Confirm no accommodation needed ✓</button>';c.querySelector('button').onclick=noAccommodation;wrap.appendChild(c);
      }else{
        const copy=lockedCopy();const c=document.createElement('section');c.className='trip-mode-card bingo-locked-card';c.innerHTML=`<span class="eyebrow">WAITING ON THE BORING BIT</span><h3>${esc(copy.title)}</h3><p>${esc(copy.text)}</p>`;wrap.appendChild(c);
      }
    } else if(!bingo.resolvedAttendance){
      const c=document.createElement('section');c.className='trip-mode-card bingo-locked-card';c.innerHTML='<span class="eyebrow">BINGO IS OPEN 👀</span><h3>Confirm whether you’re coming to join Bingo.</h3><p>Booked or Not Coming — resolve your attendance and you’re through the door.</p>';wrap.appendChild(c);
    } else {
      const note=document.createElement('section');note.className='trip-mode-card bingo-secret';note.innerHTML=`<strong>🤫 Completely secret.</strong> ${bingo.timing?.locked?'Predictions are sealed. Nobody sees the picks until the post-track Results game.':'Change your prediction up until the planned departure time. No counts, clues or percentages are shown to the crew.'}`;wrap.appendChild(note);players().forEach(x=>wrap.appendChild(playerCard(x)));
    }
    p.appendChild(wrap);
  }

  window.__tdhRefreshBingo=()=>refresh(true);
  function tick(){
    const p=panel();
    if(!p)return;
    const key=`${session?.groupId||''}:${state?.confirmedEventId||''}`;
    if(key!==eventKey){eventKey=key;refresh(true);return}
    refresh(false);
  }
  window.__tdhRefreshBingo=()=>{lastRenderSig='';if(bingo){render(true);return Promise.resolve()}return refresh(true)};
  window.__tdhDirectBingoView=true;
  window.__tdhOpenBookedBingo=openDirectView;
  window.__tdhCloseBookedBingo=closeDirectView;
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('#tdhBookedBingoView')?.hidden)closeDirectView()});
  setInterval(tick,4000);
  // trip-bingo is the authority for the gate. Keep legacy UI helpers from overwriting an already-open game.
  setInterval(()=>{if(bingo?.unlocked){window.__tdhBingoApiUnlocked=true;if(state&&state.bingoUnlocked!==true)state.bingoUnlocked=true}},100);
  window.addEventListener('focus',()=>refresh(true));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh(true)});
  setInterval(()=>{if(panel()&&bingo)render()},900);
  tick();
})();
