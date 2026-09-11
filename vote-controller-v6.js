(function(){
  let finalChoice='';

  function mine(eventId){
    return (state.votes||[]).find(v=>v.member_id===state.me?.id&&v.event_id===eventId)?.status||'';
  }

  function voteFor(memberId,eventId){
    return (state.votes||[]).find(v=>v.member_id===memberId&&v.event_id===eventId)?.status||'';
  }

  function eventById(id){
    return (events||[]).find(e=>e.id===id);
  }

  function personalMatches(){
    return rankedEvents().filter(e=>myAvailability[e.date]==='yes'||myAvailability[e.date]==='maybe');
  }

  function crewPicks(){
    const personalIds=new Set(personalMatches().map(e=>e.id));
    const wantedByOthers=new Set((state.votes||[])
      .filter(v=>v.member_id!==state.me?.id&&v.status==='yes')
      .map(v=>v.event_id));
    const myActive=new Set((state.votes||[])
      .filter(v=>v.member_id===state.me?.id&&(v.status==='yes'||v.status==='maybe'))
      .map(v=>v.event_id));
    const ids=new Set([...wantedByOthers,...myActive]);
    return rankedEvents().filter(e=>ids.has(e.id)&&!personalIds.has(e.id));
  }

  function visibleChoices(){
    const seen=new Set();
    return [...personalMatches(),...crewPicks()].filter(e=>{
      if(seen.has(e.id))return false;
      seen.add(e.id);
      return true;
    });
  }

  function discussionEvents(){
    const ids=new Set((state.votes||[])
      .filter(v=>v.status==='yes'||v.status==='maybe')
      .map(v=>v.event_id));
    return rankedEvents().filter(e=>ids.has(e.id));
  }

  function memberSubmissionIsCurrent(memberId){
    const submitted=(state.voteSubmissions||[]).some(s=>s.member_id===memberId);
    if(!submitted)return false;
    const discussion=discussionEvents();
    return discussion.every(e=>!!voteFor(memberId,e.id));
  }

  async function refreshGroup(){
    state=await api('group','GET',{groupId:session.groupId,token:session.memberToken});
    myAvailability={};
    (state.availability||[]).filter(a=>a.member_id===state.me.id).forEach(a=>{myAvailability[String(a.date).slice(0,10)]=a.status});
  }

  async function setVote(eventId,status){
    await api('vote','POST',{groupId:session.groupId,token:session.memberToken,eventId,status});
    await refreshGroup();
    renderVotes();
    renderConfirmation();
    progress();
  }

  function crewNamesFor(eventId){
    const members=state.members||[];
    return (state.votes||[])
      .filter(v=>v.event_id===eventId&&v.member_id!==state.me?.id&&v.status==='yes')
      .map(v=>members.find(m=>m.id===v.member_id)?.name)
      .filter(Boolean);
  }

  function card(e,source){
    const dt=new Date(e.date+'T12:00:00');
    const selected=mine(e.id);
    const av=myAvailability[e.date]||'';
    const price=e.price!=null?`£${e.price}`:'Price TBC';
    const avText=av==='yes'?'✓ YOU MARKED THIS DATE AVAILABLE':av==='maybe'?'? YOU MARKED THIS DATE MAYBE':'— YOU DID NOT MARK THIS DATE AVAILABLE';
    const crew=crewNamesFor(e.id);
    const crewNote=source==='crew'&&crew.length?`<div class="meta" style="margin-top:8px">Crew pick · ${crew.join(', ')} ${crew.length===1?'wants':'want'} this</div>`:'';
    return `<article class="card event"><div class="datebox"><strong>${dt.getDate()}</strong><span>${dt.toLocaleString('en-GB',{month:'short'}).toUpperCase()} ${dt.getFullYear()}</span></div><div><h3>${e.track}</h3><div class="meta">${e.live?'LIVE · ':''}${e.provider} · ${e.format} · ${price}</div>${crewNote}<div class="my-availability-badge ${av||'unmarked'}">${avText}</div><div class="vote-row vote-three"><button type="button" data-vote-choice="yes" data-event-id="${e.id}" class="${selected==='yes'?'selected':''}">Yes</button><button type="button" data-vote-choice="maybe" data-event-id="${e.id}" class="${selected==='maybe'?'selected':''}">Maybe</button><button type="button" data-vote-choice="no" data-event-id="${e.id}" class="${selected==='no'?'selected':''}">Can’t do</button></div></div><div class="score"><strong>${selected==='yes'?'Yes':selected==='maybe'?'Maybe':selected==='no'?"Can’t do":'—'}</strong><span class="meta">your choice</span></div></article>`;
  }

  renderVotes=function(){
    const el=document.querySelector('#voteList');
    const submit=document.querySelector('#confirmWinnerBtn');
    const status=document.querySelector('#voteStatus');
    if(!el||!submit||!state.me)return;

    const personal=personalMatches();
    const crew=crewPicks();
    const list=visibleChoices();

    if(!events.length){
      el.innerHTML='<div class="card"><p class="muted">Live events are still loading.</p></div>';
      submit.disabled=true;
      if(status)status.textContent='';
      return;
    }

    if(!list.length){
      el.innerHTML='<div class="card"><h3>No track days match your dates yet.</h3><p class="muted">Add more available dates, or check back as crew members add their picks.</p></div>';
      submit.disabled=true;
      if(status)status.textContent='NO CHOICES YET';
      return;
    }

    let html='';
    if(personal.length){
      html+=`<div style="margin:18px 0 10px"><span class="eyebrow">YOUR MATCHES</span><p class="muted" style="margin:6px 0 0">Track days that fall on dates you marked Yes or Maybe.</p></div>`;
      html+=personal.map(e=>card(e,'personal')).join('');
    }
    if(crew.length){
      html+=`<div style="margin:28px 0 10px"><span class="eyebrow">CREW PICKS</span><p class="muted" style="margin:6px 0 0">Choices another driver wants, even if you didn't originally mark the date available.</p></div>`;
      html+=crew.map(e=>card(e,'crew')).join('');
    }
    el.innerHTML=html;

    el.querySelectorAll('[data-vote-choice]').forEach(btn=>{
      btn.onclick=async()=>{
        const row=btn.closest('.vote-row');
        row?.querySelectorAll('button').forEach(b=>b.disabled=true);
        try{await setVote(btn.dataset.eventId,btn.dataset.voteChoice)}
        catch(err){alert('Could not update choice: '+err.message);renderVotes()}
      };
    });

    const answered=list.filter(e=>mine(e.id)).length;
    const submitted=memberSubmissionIsCurrent(state.me.id)&&answered===list.length;
    if(status)status.textContent=submitted?'CHOICES SUBMITTED':`${answered}/${list.length} ANSWERED`;
    submit.textContent=submitted?'Update submission →':'Submit choices →';
    submit.disabled=answered!==list.length;
    submit.onclick=async()=>{
      try{
        await api('submit-votes','POST',{groupId:session.groupId,token:session.memberToken,eventIds:list.map(e=>e.id)});
        await refreshGroup();
        renderVotes();
        renderConfirmation();
        stage('confirm');
      }catch(err){alert(err.message)}
    };
  };

  function renderConfirmation(){
    const el=document.querySelector('#confirmationList');
    const confirmBtn=document.querySelector('#finalConfirmBtn');
    const status=document.querySelector('#confirmationStatus');
    if(!el||!confirmBtn||!state.me)return;

    const members=state.members||[];
    const viable=discussionEvents();
    const currentSubmitters=members.filter(m=>memberSubmissionIsCurrent(m.id));
    const everyoneSubmitted=members.length>0&&currentSubmitters.length===members.length;
    if(status)status.textContent=everyoneSubmitted?`ALL ${members.length} SUBMITTED`:`${currentSubmitters.length}/${members.length} CURRENT`;

    const name=id=>members.find(m=>m.id===id)?.name||'Unknown';

    if(!viable.length){
      el.innerHTML=`<div class="card"><h3>${members.length} in group</h3><p class="muted">No track day has a Yes or Maybe yet.</p></div>`;
      confirmBtn.disabled=true;
      return;
    }

    if(finalChoice&&!viable.some(e=>e.id===finalChoice))finalChoice='';

    const needsResponse=members.filter(m=>!memberSubmissionIsCurrent(m.id)).map(m=>m.name);
    el.innerHTML=`<div class="card"><span class="eyebrow">GROUP STATUS</span><h3>${members.length} in group · ${currentSubmitters.length} up to date</h3>${needsResponse.length?`<p class="muted">Waiting on: ${needsResponse.join(', ')}</p>`:''}</div>`+viable.map(e=>{
      const dt=new Date(e.date+'T12:00:00');
      const votes=(state.votes||[]).filter(v=>v.event_id===e.id);
      const yes=votes.filter(v=>v.status==='yes').map(v=>name(v.member_id));
      const maybe=votes.filter(v=>v.status==='maybe').map(v=>name(v.member_id));
      const no=votes.filter(v=>v.status==='no').map(v=>name(v.member_id));
      const unanswered=members.filter(m=>!votes.some(v=>v.member_id===m.id)).map(m=>m.name);
      const selected=e.id===finalChoice;
      const price=e.price!=null?`£${e.price}`:'Price TBC';
      return `<article class="card event confirmation-choice ${selected?'selected':''}"><div class="datebox"><strong>${dt.getDate()}</strong><span>${dt.toLocaleString('en-GB',{month:'short'}).toUpperCase()} ${dt.getFullYear()}</span></div><div><h3>${e.track}</h3><div class="meta">${e.provider} · ${e.format} · ${price}</div><div class="confirmation-breakdown"><div><strong>Yes (${yes.length}/${members.length})</strong><span>${yes.join(', ')||'Nobody'}</span></div><div><strong>Maybe (${maybe.length})</strong><span>${maybe.join(', ')||'Nobody'}</span></div><div><strong>Can’t do (${no.length})</strong><span>${no.join(', ')||'Nobody'}</span></div>${unanswered.length?`<div><strong>Needs a response (${unanswered.length})</strong><span>${unanswered.join(', ')}</span></div>`:''}</div><div class="vote-row"><button type="button" data-final-choice="${e.id}" class="${selected?'selected':''}">${selected?'Deselect final choice':'Select this track day'}</button></div></div><div class="score"><strong>${yes.length}</strong><span class="meta">yes · ${maybe.length} maybe</span></div></article>`;
    }).join('');

    el.querySelectorAll('[data-final-choice]').forEach(btn=>{
      btn.onclick=()=>{finalChoice=finalChoice===btn.dataset.finalChoice?'':btn.dataset.finalChoice;renderConfirmation()};
    });

    confirmBtn.disabled=!everyoneSubmitted||!finalChoice;
    confirmBtn.onclick=async()=>{
      if(!finalChoice)return;
      confirmBtn.disabled=true;
      try{
        await api('confirm','POST',{groupId:session.groupId,token:session.memberToken,eventId:finalChoice});
        await refreshGroup();
        renderTrip();
        progress();
        stage('trip');
      }catch(err){alert('Could not confirm track day: '+err.message);renderConfirmation()}
    };
  }

  const baseStage=stage;
  stage=function(id){
    baseStage(id);
    if(id==='vote')renderVotes();
    if(id==='confirm')renderConfirmation();
  };

  const baseRender=render;
  render=function(){
    baseRender();
    renderConfirmation();
  };

  document.querySelectorAll('[data-stage]').forEach(btn=>{btn.onclick=()=>stage(btn.dataset.stage)});

  if(state.me){
    renderVotes();
    renderConfirmation();
  }
})();