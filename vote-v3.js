// Three-way voting: Yes / Maybe / Can't do, with explicit submission.
const choiceLabel={yes:'Yes',maybe:'Maybe',no:"Can't do"};

async function setVoteChoice(eventId,status){
  await api('vote','POST',{groupId:session.groupId,token:session.memberToken,eventId,status});
  await loadGroup();
}

function myVoteFor(eventId){
  return (state.votes||[]).find(v=>v.member_id===state.me?.id&&v.event_id===eventId)?.status||'';
}

function renderVotes(){
  const el=document.querySelector('#voteList');
  const submit=document.querySelector('#confirmWinnerBtn');
  const status=document.querySelector('#voteStatus');
  if(!el||!submit)return;
  const list=shortlist();
  if(!list.length){
    el.innerHTML='<div class="card"><p class="muted">Live events are still loading.</p></div>';
    submit.disabled=true;
    if(status)status.textContent='';
    return;
  }

  el.innerHTML=list.map(e=>{
    const dt=new Date(e.date+'T12:00:00');
    const mine=myVoteFor(e.id);
    const price=e.price!=null?`£${e.price}`:'Price TBC';
    const av=myAvailability[e.date]||'';
    const avText=av==='yes'?'✓ You marked this date available':av==='maybe'?'? You marked this date maybe':'— You did not mark this date available';
    return `<article class="card event">
      <div class="datebox"><strong>${dt.getDate()}</strong><span>${dt.toLocaleString('en-GB',{month:'short'}).toUpperCase()} ${dt.getFullYear()}</span></div>
      <div><h3>${e.track}</h3><div class="meta">${e.provider} · ${e.format} · ${price}</div><div class="my-availability-badge ${av||'unmarked'}">${avText}</div>
      <div class="vote-row vote-three">
        <button type="button" data-choice="yes" data-event="${e.id}" class="${mine==='yes'?'selected':''}">Yes</button>
        <button type="button" data-choice="maybe" data-event="${e.id}" class="${mine==='maybe'?'selected':''}">Maybe</button>
        <button type="button" data-choice="no" data-event="${e.id}" class="${mine==='no'?'selected':''}">Can't do</button>
      </div></div>
      <div class="score"><strong>${mine?choiceLabel[mine]:'—'}</strong><span class="meta">your choice</span></div>
    </article>`;
  }).join('');

  el.querySelectorAll('[data-choice]').forEach(btn=>{
    btn.onclick=async()=>{
      btn.disabled=true;
      try{await setVoteChoice(btn.dataset.event,btn.dataset.choice)}catch(e){alert('Could not update choice: '+e.message)}
    };
  });

  const answered=list.filter(e=>myVoteFor(e.id)).length;
  const submitted=(state.voteSubmissions||[]).some(s=>s.member_id===state.me?.id);
  if(status)status.textContent=submitted?'CHOICES SUBMITTED':`${answered}/${list.length} ANSWERED`;
  submit.textContent=submitted?'Update submission →':'Submit choices →';
  submit.disabled=answered!==list.length;
}

function renderConfirmation(){
  const el=document.querySelector('#confirmationList');
  const confirmBtn=document.querySelector('#finalConfirmBtn');
  const status=document.querySelector('#confirmationStatus');
  if(!el||!confirmBtn)return;
  const list=shortlist();
  const members=state.members||[];
  const submissions=new Set((state.voteSubmissions||[]).map(s=>s.member_id));
  const everyoneSubmitted=members.length>0&&submissions.size===members.length;
  if(status)status.textContent=everyoneSubmitted?`ALL ${members.length} SUBMITTED`:`${submissions.size}/${members.length} SUBMITTED`;

  const viable=list.filter(e=>(state.votes||[]).some(v=>v.event_id===e.id&&(v.status==='yes'||v.status==='maybe'));
  if(!viable.length){
    el.innerHTML='<div class="card"><p class="muted">No viable choices yet.</p></div>';
    confirmBtn.disabled=true;
    return;
  }
  if(finalConfirmationChoice&&!viable.some(e=>e.id===finalConfirmationChoice))finalConfirmationChoice='';

  const memberName=id=>members.find(m=>m.id===id)?.name||'Unknown';
  el.innerHTML=viable.map(e=>{
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
          <div><strong>Can't do (${no.length})</strong><span>${no.join(', ')||'Nobody'}</span></div>
          ${unanswered.length?`<div><strong>Not answered (${unanswered.length})</strong><span>${unanswered.join(', ')}</span></div>`:''}
        </div>
        <div class="vote-row"><button type="button" data-pick-confirm="${e.id}" class="${selected?'selected':''}">${selected?'Final choice ✓':'Select this track day'}</button></div>
      </div>
      <div class="score"><strong>${yes.length}</strong><span class="meta">yes · ${maybe.length} maybe</span></div>
    </article>`;
  }).join('');
  el.querySelectorAll('[data-pick-confirm]').forEach(btn=>btn.onclick=()=>{finalConfirmationChoice=btn.dataset.pickConfirm;renderConfirmation()});
  confirmBtn.disabled=!everyoneSubmitted||!finalConfirmationChoice;
}

const submitChoicesV3=document.querySelector('#confirmWinnerBtn');
if(submitChoicesV3){
  submitChoicesV3.onclick=async()=>{
    const ids=shortlist().map(e=>e.id);
    try{
      await api('submit-votes','POST',{groupId:session.groupId,token:session.memberToken,eventIds:ids});
      await loadGroup();
      renderConfirmation();
      stage('confirm');
    }catch(e){alert(e.message)}
  };
}

// refresh both overridden views after this script loads
renderVotes();
renderConfirmation();
