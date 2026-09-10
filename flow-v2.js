// Vote submission -> separate final confirmation flow.
let finalConfirmationChoice='';

function memberName(id){return (state.members||[]).find(m=>m.id===id)?.name||'Unknown'}
function availabilityFor(memberId,date){
  return (state.availability||[]).find(a=>a.member_id===memberId&&String(a.date).slice(0,10)===date)?.status||'';
}
function namesFor(ids){return ids.length?ids.map(memberName).join(', '):'None'}

function renderConfirmation(){
  const el=document.querySelector('#confirmationList');
  const confirmBtn=document.querySelector('#finalConfirmBtn');
  const status=document.querySelector('#confirmationStatus');
  if(!el||!confirmBtn)return;

  const members=state.members||[];
  const votes=state.votes||[];
  const counts={};
  votes.forEach(v=>counts[v.event_id]=(counts[v.event_id]||0)+1);
  const votedIds=new Set(Object.keys(counts));
  const choices=shortlist()
    .filter(e=>votedIds.has(e.id))
    .sort((a,b)=>(counts[b.id]||0)-(counts[a.id]||0)||a.date.localeCompare(b.date));

  const voters=new Set(votes.map(v=>v.member_id));
  const everyoneResponded=voters.size===members.length;
  const waiting=members.filter(m=>!voters.has(m.id)).map(m=>m.name);

  if(status)status.textContent=`${voters.size}/${members.length} VOTED`;

  if(!choices.length){
    el.innerHTML=`<div class="card"><h3>${members.length} in group</h3><p class="muted">No choices have been submitted yet.</p>${waiting.length?`<p class="muted">Waiting for: ${waiting.join(', ')}</p>`:''}</div>`;
    confirmBtn.disabled=true;
    return;
  }

  if(!finalConfirmationChoice||!choices.some(e=>e.id===finalConfirmationChoice)) finalConfirmationChoice='';

  const summary=`<div class="card"><span class="eyebrow">GROUP STATUS</span><h3>${members.length} in group · ${voters.size} voted</h3><p class="muted">${everyoneResponded?'Everyone has submitted choices.':`Waiting for: ${waiting.join(', ')}`}</p></div>`;

  el.innerHTML=summary+choices.map(e=>{
    const dt=new Date(e.date+'T12:00:00');
    const selected=e.id===finalConfirmationChoice;
    const price=e.price!=null?`£${e.price}`:'Price TBC';
    const eventVoters=votes.filter(v=>v.event_id===e.id).map(v=>v.member_id);
    const yes=members.filter(m=>availabilityFor(m.id,e.date)==='yes').map(m=>m.id);
    const maybe=members.filter(m=>availabilityFor(m.id,e.date)==='maybe').map(m=>m.id);
    const unavailable=members.filter(m=>!yes.includes(m.id)&&!maybe.includes(m.id)).map(m=>m.id);

    return `<article class="card confirmation-choice ${selected?'selected':''}" data-confirm-choice="${e.id}">
      <div class="datebox"><strong>${dt.getDate()}</strong><span>${dt.toLocaleString('en-GB',{month:'short'}).toUpperCase()} ${dt.getFullYear()}</span></div>
      <div>
        <h3>${e.track}</h3>
        <div class="meta">${e.provider} · ${e.format} · ${price}</div>
        <div class="confirm-detail" style="margin-top:12px">
          <p><strong>Voted for it (${eventVoters.length}/${members.length}):</strong> ${namesFor(eventVoters)}</p>
          <p><strong>Available:</strong> ${namesFor(yes)}</p>
          ${maybe.length?`<p><strong>Maybe:</strong> ${namesFor(maybe)}</p>`:''}
          <p><strong>Can’t make it:</strong> ${namesFor(unavailable)}</p>
        </div>
        <div class="vote-row"><button type="button" data-pick-confirm="${e.id}" class="${selected?'selected':''}">${selected?'Final choice ✓':'Select this track day'}</button></div>
      </div>
    </article>`;
  }).join('');

  el.querySelectorAll('[data-pick-confirm]').forEach(btn=>{
    btn.onclick=()=>{finalConfirmationChoice=btn.dataset.pickConfirm;renderConfirmation()};
  });
  confirmBtn.disabled=!finalConfirmationChoice||!everyoneResponded;
}

const originalRenderVotes=renderVotes;
renderVotes=function(){
  originalRenderVotes();
  const submit=document.querySelector('#confirmWinnerBtn');
  if(!submit)return;
  const mine=(state.votes||[]).filter(v=>v.member_id===state.me?.id);
  submit.textContent='Submit choices →';
  submit.disabled=mine.length===0;
  submit.removeAttribute('data-winner');
};

const originalRender=render;
render=function(){
  originalRender();
  renderConfirmation();
};

// Availability now flows directly into voting; the separate Matches screen is intentionally skipped.
const findChoicesBtn=document.querySelector('#findBtn');
if(findChoicesBtn){
  findChoicesBtn.textContent='Show track day choices →';
  findChoicesBtn.onclick=async()=>{
    if(availabilityDirty)await flushAvailability();
    try{
      state=await api('group','GET',{groupId:session.groupId,token:session.memberToken});
      myAvailability={};
      (state.availability||[]).filter(a=>a.member_id===state.me.id).forEach(a=>myAvailability[String(a.date).slice(0,10)]=a.status);
      await loadEvents(true);
      render();
      stage('vote');
    }catch(e){alert('Could not load track day choices: '+e.message)}
  };
}

const submitChoices=document.querySelector('#confirmWinnerBtn');
if(submitChoices){
  submitChoices.textContent='Submit choices →';
  submitChoices.onclick=async()=>{
    try{
      await loadGroup();
      renderConfirmation();
      stage('confirm');
    }catch(e){alert('Could not submit choices: '+e.message)}
  };
}

const finalConfirmBtn=document.querySelector('#finalConfirmBtn');
if(finalConfirmBtn){
  finalConfirmBtn.onclick=async()=>{
    if(!finalConfirmationChoice)return;
    finalConfirmBtn.disabled=true;
    try{
      await api('confirm','POST',{groupId:session.groupId,token:session.memberToken,eventId:finalConfirmationChoice});
      await loadGroup();
      stage('trip');
    }catch(e){
      alert('Could not confirm track day: '+e.message);
      renderConfirmation();
    }
  };
}

renderVotes();
renderConfirmation();
