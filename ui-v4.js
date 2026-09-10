// Hard override for voting/confirmation UI. Loaded last to beat stale legacy handlers.
(function(){
  const labels={yes:'Yes',maybe:'Maybe',no:"Can't do"};
  const q=s=>document.querySelector(s);

  function myVote(eventId){
    return (state.votes||[]).find(v=>v.member_id===state.me?.id&&v.event_id===eventId)?.status||'';
  }

  async function choose(eventId,status){
    await api('vote','POST',{groupId:session.groupId,token:session.memberToken,eventId,status});
    state=await api('group','GET',{groupId:session.groupId,token:session.memberToken});
    myAvailability={};
    (state.availability||[]).filter(a=>a.member_id===state.me.id).forEach(a=>myAvailability[String(a.date).slice(0,10)]=a.status);
    renderVotesV4();
    renderConfirmationV4();
  }

  function renderVotesV4(){
    const el=q('#voteList'), submit=q('#confirmWinnerBtn'), stat=q('#voteStatus');
    if(!el||!submit||!state.me)return;
    const list=shortlist();
    if(!list.length){
      el.innerHTML='<div class="card"><p class="muted">Live events are still loading.</p></div>';
      submit.disabled=true;
      if(stat)stat.textContent='';
      return;
    }

    el.innerHTML=list.map(e=>{
      const dt=new Date(e.date+'T12:00:00');
      const mine=myVote(e.id);
      const av=myAvailability[e.date]||'';
      const avText=av==='yes'?'✓ YOU MARKED THIS DATE AVAILABLE':av==='maybe'?'? YOU MARKED THIS DATE MAYBE':'— YOU DID NOT MARK THIS DATE AVAILABLE';
      const price=e.price!=null?`£${e.price}`:'Price TBC';
      return `<article class="card event">
        <div class="datebox"><strong>${dt.getDate()}</strong><span>${dt.toLocaleString('en-GB',{month:'short'}).toUpperCase()} ${dt.getFullYear()}</span></div>
        <div><h3>${e.track}</h3><div class="meta">${e.provider} · ${e.format} · ${price}</div>
          <div class="my-availability-badge ${av||'unmarked'}">${avText}</div>
          <div class="vote-row vote-three">
            <button type="button" data-v4-choice="yes" data-event="${e.id}" class="${mine==='yes'?'selected':''}">Yes</button>
            <button type="button" data-v4-choice="maybe" data-event="${e.id}" class="${mine==='maybe'?'selected':''}">Maybe</button>
            <button type="button" data-v4-choice="no" data-event="${e.id}" class="${mine==='no'?'selected':''}">Can't do</button>
          </div>
        </div>
        <div class="score"><strong>${mine?labels[mine]:'—'}</strong><span class="meta">your choice</span></div>
      </article>`;
    }).join('');

    el.querySelectorAll('[data-v4-choice]').forEach(btn=>{
      btn.onclick=async()=>{
        btn.disabled=true;
        try{await choose(btn.dataset.event,btn.dataset.v4Choice)}
        catch(e){alert('Could not update choice: '+e.message);renderVotesV4()}
      };
    });

    const answered=list.filter(e=>myVote(e.id)).length;
    const submitted=(state.voteSubmissions||[]).some(s=>s.member_id===state.me?.id);
    if(stat)stat.textContent=submitted?'CHOICES SUBMITTED':`${answered}/${list.length} ANSWERED`;
    submit.textContent=submitted?'Update submission →':'Submit choices →';
    submit.disabled=answered!==list.length;
    submit.onclick=async()=>{
      try{
        await api('submit-votes','POST',{groupId:session.groupId,token:session.memberToken,eventIds:list.map(e=>e.id)});
        state=await api('group','GET',{groupId:session.groupId,token:session.memberToken});
        renderConfirmationV4();
        stage('confirm');
      }catch(e){alert(e.message)}
    };
  }

  function renderConfirmationV4(){
    const el=q('#confirmationList'), confirmBtn=q('#finalConfirmBtn'), stat=q('#confirmationStatus');
    if(!el||!confirmBtn||!state.me)return;
    const members=state.members||[], list=shortlist();
    const submissions=new Set((state.voteSubmissions||[]).map(s=>s.member_id));
    const everyoneSubmitted=members.length>0&&submissions.size===members.length;
    if(stat)stat.textContent=everyoneSubmitted?`ALL ${members.length} SUBMITTED`:`${submissions.size}/${members.length} SUBMITTED`;
    const name=id=>members.find(m=>m.id===id)?.name||'Unknown';
    const viable=list.filter(e=>(state.votes||[]).some(v=>v.event_id===e.id&&(v.status==='yes'||v.status==='maybe'));
    if(!viable.length){el.innerHTML='<div class="card"><p class="muted">No viable choices yet.</p></div>';confirmBtn.disabled=true;return;}
    if(finalConfirmationChoice&&!viable.some(e=>e.id===finalConfirmationChoice))finalConfirmationChoice='';

    el.innerHTML=viable.map(e=>{
      const dt=new Date(e.date+'T12:00:00'), votes=(state.votes||[]).filter(v=>v.event_id===e.id);
      const yes=votes.filter(v=>v.status==='yes').map(v=>name(v.member_id));
      const maybe=votes.filter(v=>v.status==='maybe').map(v=>name(v.member_id));
      const no=votes.filter(v=>v.status==='no').map(v=>name(v.member_id));
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
          <div class="vote-row"><button type="button" data-v4-final="${e.id}" class="${selected?'selected':''}">${selected?'Deselect final choice':'Select this track day'}</button></div>
        </div>
        <div class="score"><strong>${yes.length}</strong><span class="meta">yes · ${maybe.length} maybe</span></div>
      </article>`;
    }).join('');

    el.querySelectorAll('[data-v4-final]').forEach(btn=>{
      btn.onclick=()=>{
        finalConfirmationChoice=finalConfirmationChoice===btn.dataset.v4Final?'':btn.dataset.v4Final;
        renderConfirmationV4();
      };
    });

    confirmBtn.disabled=!everyoneSubmitted||!finalConfirmationChoice;
  }

  // Override globally and repaint immediately.
  renderVotes=renderVotesV4;
  renderConfirmation=renderConfirmationV4;
  renderVotesV4();
  renderConfirmationV4();
})();