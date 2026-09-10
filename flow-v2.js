// Vote submission -> separate final confirmation flow.
let finalConfirmationChoice='';

function renderConfirmation(){
  const el=document.querySelector('#confirmationList');
  const confirmBtn=document.querySelector('#finalConfirmBtn');
  const status=document.querySelector('#confirmationStatus');
  if(!el||!confirmBtn)return;

  const counts={};
  (state.votes||[]).forEach(v=>counts[v.event_id]=(counts[v.event_id]||0)+1);
  const votedIds=new Set(Object.keys(counts));
  const choices=shortlist()
    .filter(e=>votedIds.has(e.id))
    .sort((a,b)=>(counts[b.id]||0)-(counts[a.id]||0)||a.date.localeCompare(b.date));

  if(!choices.length){
    el.innerHTML='<div class="card"><p class="muted">No choices have been submitted yet.</p></div>';
    confirmBtn.disabled=true;
    if(status)status.textContent='';
    return;
  }

  if(!finalConfirmationChoice||!choices.some(e=>e.id===finalConfirmationChoice)) finalConfirmationChoice='';

  const voters=new Set((state.votes||[]).map(v=>v.member_id));
  const everyoneResponded=voters.size===(state.members||[]).length;
  if(status)status.textContent=everyoneResponded?'EVERYONE RESPONDED':`${voters.size}/${(state.members||[]).length} RESPONDED`;

  el.innerHTML=choices.map(e=>{
    const dt=new Date(e.date+'T12:00:00');
    const selected=e.id===finalConfirmationChoice;
    const price=e.price!=null?`£${e.price}`:'Price TBC';
    return `<article class="card event confirmation-choice ${selected?'selected':''}" data-confirm-choice="${e.id}">
      <div class="datebox"><strong>${dt.getDate()}</strong><span>${dt.toLocaleString('en-GB',{month:'short'}).toUpperCase()} ${dt.getFullYear()}</span></div>
      <div><h3>${e.track}</h3><div class="meta">${e.provider} · ${e.format} · ${price}</div><div class="vote-row"><button type="button" data-pick-confirm="${e.id}" class="${selected?'selected':''}">${selected?'Final choice ✓':'Select this track day'}</button></div></div>
      <div class="score"><strong>${counts[e.id]||0}</strong><span class="meta">vote${(counts[e.id]||0)===1?'':'s'}</span></div>
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
