// Single clean controller for Vote -> Confirm. Loaded after app.js.
let finalConfirmationChoice='';

function myVoteStatus(eventId){
  return (state.votes||[]).find(v=>v.member_id===state.me?.id&&v.event_id===eventId)?.status||'';
}

async function refreshGroupState(){
  state=await api('group','GET',{groupId:session.groupId,token:session.memberToken});
  myAvailability={};
  (state.availability||[]).filter(a=>a.member_id===state.me.id).forEach(a=>myAvailability[String(a.date).slice(0,10)]=a.status);
}

async function saveVoteChoice(eventId,status){
  await api('vote','POST',{groupId:session.groupId,token:session.memberToken,eventId,status});
  await refreshGroupState();
  renderVotes();
  renderConfirmation();
  progress();
}

function renderVotes(){
  const el=document.querySelector('#voteList');
  const submit=document.querySelector('#confirmWinnerBtn');
  const status=document.querySelector('#voteStatus');
  if(!el||!submit||!state.me)return;
  const list=shortlist();
  if(!list.length){
    el.innerHTML='<div class="card"><p class="muted">Live events are still loading.</p></div>';
    submit.disabled=true;
    if(status)status.textContent='';
    return;
  }

  el.innerHTML=list.map(e=>{
    const dt=new Date(e.date+'T12:00:00');
    const mine=myVoteStatus(e.id);
    const av=myAvailability[e.date]||'';
    const price=e.price!=null?`£${e.price}`:'Price TBC';
    const avText=av==='yes'?'✓ YOU MARKED THIS DATE AVAILABLE':av==='maybe'?'? YOU MARKED THIS DATE MAYBE':'— YOU DID NOT MARK THIS DATE AVAILABLE';
    return `<article class="card event">
      <div class="datebox"><strong>${dt.getDate()}</strong><span>${dt.toLocaleString('en-GB',{month:'short'}).toUpperCase()} ${dt.getFullYear()}</span></div>
      <div><h3>${e.track}</h3><div class="meta">${e.live?'LIVE · ':''}${e.provider} · ${e.format} · ${price}</div>
        <div class="my-availability-badge ${av||'unmarked'}">${avText}</div>
        <div class="vote-row vote-three">
          <button type="button" data-choice="yes" data-event="${e.id}" class="${mine==='yes'?'selected':''}">Yes</button>
          <button type="button" data-choice="maybe" data-event="${e.id}" class="${mine==='maybe'?'selected':''}">Maybe</button>
          <button type="button" data-choice="no" data-event="${e.id}" class="${mine==='no'?'selected':''}">Can’t do</button>
        </div>
      </div>
      <div class="score"><strong>${mine==='yes'?'Yes':mine==='maybe'?'Maybe':mine==='no'?"Can’t do":'—'}</strong><span class="meta">your choice</span></div>
    </article>`;
  }).join('');

  el.querySelectorAll('[data-choice]').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      const row=btn.closest('.vote-row');
      row?.querySelectorAll('button').forEach(b=>b.disabled=true);
      try{await saveVoteChoice(btn.dataset.event,btn.dataset.choice)}
      catch(e){alert('Could not update choice: '+e.message);renderVotes()}
    });
  });

  const answered=list.filter(e=>myVoteStatus(e.id)).length;
  const submitted=(state.voteSubmissions||[]).some(s=>s.member_id===state.me.id);
  if(status)status.textContent=submitted?'CHOICES SUBMITTED':`${answered}/${list.length} ANSWERED`;
  submit.textContent=submitted?'Update submission →':'Submit choices →';
  submit.disabled=answered!==list.length;
  submit.onclick=async()=>{
    try{
      await api('submit-votes','POST',{groupId:session.groupId,token:session.memberToken,eventIds:list.map(e=>e.id)});
      await refreshGroupState();
      renderConfirmation();
      stage('confirm');
    }catch(e){alert(e.message)}
  };
}

function renderConfirmation(){
  const el=document.querySelector('#confirmationList');
  const confirmBtn=document.querySelector('#finalConfirmBtn');
  const status=document.querySelector('#confirmationStatus');
  if(!el||!confirmBtn||!state.me)return;
  const members=state.members||[];
  const submissions=new Set((state.voteSubmissions||[]).map(s=>s.member_id));
  const everyoneSubmitted=members.length>0&&submissions.size===members.length;
  if(status)status.textContent=everyoneSubmitted?`ALL ${members.length} SUBMITTED`:`${submissions.size}/${members.length} SUBMITTED`;
  const memberName=id=>members.find(m=>m.id===id)?.name||'Unknown';
  const list=shortlist();
  const viable=list.filter(e=>(state.votes||[]).some(v=>v.event_id===e.id&&(v.status==='yes'||v.status==='maybe'));

  if(!viable.length){
    el.innerHTML=`<div class="card"><h3>${members.length} in group</h3><p class="muted">No viable choices yet.</p></div>`;
    confirmBtn.disabled=true;
    return;
  }
  if(finalConfirmationChoice&&!viable.some(e=>e.id===finalConfirmationChoice))finalConfirmationChoice='';

  el.innerHTML=`<div class="card"><span class="eyebrow">GROUP STATUS</span><h3>${members.length} in group · ${submissions.size} submitted</h3></div>`+viable.map(e=>{
    const dt=new Date(e.date+'T12:00:00');
    const votes=(state.votes||[]).filter(v=>v.event_id===e.id);
    const yes=votes.filter(v=>v.status==='yes').map(v=>memberName(v.member_id));
    const maybe=votes.filter(v=>v.status==='maybe').map(v=>memberName(v.member_id));
    const no=votes.filter(v=>v.status==='no').map(v=>memberName(v.member_id));
    const unanswered=members.filter(m=>!votes.some(v=>v.member_id===m.id)).map(m=>m.name);
    const selected=e.id===finalConfirmationChoice;
    const price=e.price!=null?`£${e.price}`:'Price TBC';
    return `<article class="card event confirmation-choice ${selected?'selected':''}">
      <div class="datebox"><strong>${dt.getDate()}</strong><span>${dt.toLocaleString('en-GB',{month:'short'}).toUpperCase()} ${dt.getFullYear()}</span></div>
      <div><h3>${e.track}</h3><div class="meta">${e.provider} · ${e.format} · ${price}</div>
        <div class="confirmation-breakdown">
          <div><strong>Yes (${yes.length}/${members.length})</strong><span>${yes.join(', ')||'Nobody'}</span></div>
          <div><strong>Maybe (${maybe.length})</strong><span>${maybe.join(', ')||'Nobody'}</span></div>
          <div><strong>Can’t do (${no.length})</strong><span>${no.join(', ')||'Nobody'}</span></div>
          ${unanswered.length?`<div><strong>Not answered (${unanswered.length})</strong><span>${unanswered.join(', ')}</span></div>`:''}
        </div>
        <div class="vote-row"><button type="button" data-final="${e.id}" class="${selected?'selected':''}">${selected?'Deselect final choice':'Select this track day'}</button></div>
      </div>
      <div class="score"><strong>${yes.length}</strong><span class="meta">yes · ${maybe.length} maybe</span></div>
    </article>`;
  }).join('');

  el.querySelectorAll('[data-final]').forEach(btn=>{
    btn.onclick=()=>{
      finalConfirmationChoice=finalConfirmationChoice===btn.dataset.final?'':btn.dataset.final;
      renderConfirmation();
    };
  });
  confirmBtn.disabled=!everyoneSubmitted||!finalConfirmationChoice;
  confirmBtn.onclick=async()=>{
    if(!finalConfirmationChoice)return;
    confirmBtn.disabled=true;
    try{
      await api('confirm','POST',{groupId:session.groupId,token:session.memberToken,eventId:finalConfirmationChoice});
      await refreshGroupState();
      renderTrip();progress();stage('trip');
    }catch(e){alert('Could not confirm track day: '+e.message);renderConfirmation()}
  };
}

const baseRender=render;
render=function(){
  baseRender();
  renderConfirmation();
};

const findButton=document.querySelector('#findBtn');
if(findButton){
  findButton.onclick=async()=>{
    if(availabilityDirty)await flushAvailability();
    try{
      await refreshGroupState();
      await loadEvents(true);
      render();
      stage('vote');
    }catch(e){alert('Could not load track day choices: '+e.message)}
  };
}

document.querySelectorAll('[data-stage]').forEach(b=>{
  b.onclick=()=>{
    stage(b.dataset.stage);
    if(b.dataset.stage==='vote')renderVotes();
    if(b.dataset.stage==='confirm')renderConfirmation();
  };
});

// Repaint once if the initial group request has already completed.
if(state.me){render();}
