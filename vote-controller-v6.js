(function(){
  let selectedDecisionEventId='';

  const mine=id=>(state.votes||[]).find(v=>v.member_id===state.me?.id&&v.event_id===id)?.status||'';
  const memberName=id=>(state.members||[]).find(m=>m.id===id)?.name||'Unknown';
  const personalMatches=()=>rankedEvents().filter(e=>['yes','maybe'].includes(myAvailability[e.date]));

  function crewPicks(){
    const personal=new Set(personalMatches().map(e=>e.id));
    const ids=new Set((state.votes||[])
      .filter(v=>v.member_id!==state.me?.id&&['yes','maybe'].includes(v.status))
      .map(v=>v.event_id));
    return rankedEvents().filter(e=>ids.has(e.id)&&!personal.has(e.id));
  }

  function visibleChoices(){
    const seen=new Set();
    return [...personalMatches(),...crewPicks()].filter(e=>!seen.has(e.id)&&seen.add(e.id));
  }

  function discussionEvents(){
    const ids=new Set((state.votes||[]).filter(v=>['yes','maybe'].includes(v.status)).map(v=>v.event_id));
    return rankedEvents().filter(e=>ids.has(e.id));
  }

  async function refreshGroup(){
    state=await api('group','GET',{groupId:session.groupId,token:session.memberToken});
    myAvailability={};
    (state.availability||[]).filter(a=>a.member_id===state.me.id)
      .forEach(a=>myAvailability[String(a.date).slice(0,10)]=a.status);
  }

  function voteButtons(e){
    const selected=mine(e.id);
    return `<div class="vote-row vote-three">
      <button type="button" data-vote-choice="yes" data-event-id="${e.id}" class="${selected==='yes'?'selected':''}">Yes</button>
      <button type="button" data-vote-choice="maybe" data-event-id="${e.id}" class="${selected==='maybe'?'selected':''}">Maybe</button>
      <button type="button" data-vote-choice="no" data-event-id="${e.id}" class="${selected==='no'?'selected':''}">Can’t do</button>
    </div>`;
  }

  function bindVotes(root){
    root.querySelectorAll('[data-vote-choice]').forEach(btn=>btn.onclick=async()=>{
      const row=btn.closest('.vote-row');
      const card=btn.closest('.event');
      if(row?.dataset.saving==='1')return;
      row.dataset.saving='1';
      row.querySelectorAll('[data-vote-choice]').forEach(b=>b.classList.remove('selected'));
      btn.classList.add('selected');
      const score=card?.querySelector('.score strong');
      if(score)score.textContent=btn.dataset.voteChoice==='yes'?'Yes':btn.dataset.voteChoice==='maybe'?'Maybe':'Can’t do';
      try{
        await api('vote','POST',{groupId:session.groupId,token:session.memberToken,eventId:btn.dataset.eventId,status:btn.dataset.voteChoice});
        await refreshGroup();
        renderVotes();
        renderConfirmation();
        progress();
      }catch(err){
        alert('Could not update choice: '+err.message);
        renderVotes();
        renderConfirmation();
      }
    });
  }

  function choiceCard(e,source){
    const dt=new Date(e.date+'T12:00:00');
    const selected=mine(e.id),av=myAvailability[e.date]||'',price=e.price!=null?`£${e.price}`:'Price TBC';
    const crew=(state.votes||[]).filter(v=>v.event_id===e.id&&v.member_id!==state.me?.id&&['yes','maybe'].includes(v.status))
      .map(v=>memberName(v.member_id)).filter(Boolean);
    return `<article class="card event">
      <div class="datebox"><strong>${dt.getDate()}</strong><span>${dt.toLocaleString('en-GB',{month:'short'}).toUpperCase()} ${dt.getFullYear()}</span></div>
      <div><h3>${e.track}</h3><div class="meta">${e.provider} · ${e.format} · ${price}</div>
      ${source==='crew'&&crew.length?`<div class="meta" style="margin-top:8px">Crew pick · ${crew.join(', ')}</div>`:''}
      <div class="my-availability-badge ${av||'unmarked'}">${av==='yes'?'✓ YOU MARKED THIS DATE AVAILABLE':av==='maybe'?'? YOU MARKED THIS DATE MAYBE':'— YOU DID NOT MARK THIS DATE AVAILABLE'}</div>${voteButtons(e)}</div>
      <div class="score"><strong>${selected==='yes'?'Yes':selected==='maybe'?'Maybe':selected==='no'?"Can’t do":'—'}</strong><span class="meta">your choice</span></div>
    </article>`;
  }

  renderVotes=function(){
    const el=document.querySelector('#voteList'),next=document.querySelector('#confirmWinnerBtn'),status=document.querySelector('#voteStatus');
    if(!el||!next||!state.me)return;
    const personal=personalMatches(),crew=crewPicks(),list=visibleChoices();
    if(!events.length){el.innerHTML='<div class="card"><p class="muted">Live events are still loading.</p></div>';next.disabled=true;return;}
    if(!list.length){el.innerHTML='<div class="card"><h3>No track days match your dates yet.</h3><p class="muted">Add more available dates, or check back as crew members add their picks.</p></div>';next.disabled=true;if(status)status.textContent='NO CHOICES YET';return;}
    let html='';
    if(personal.length)html+=`<div class="choice-section"><span class="eyebrow">YOUR MATCHES</span><p class="muted">Track days matching your dates.</p></div>${personal.map(e=>choiceCard(e,'personal')).join('')}`;
    if(crew.length)html+=`<div class="choice-section crew"><span class="eyebrow">CREW PICKS</span><p class="muted">Track days somebody else has put into the conversation.</p></div>${crew.map(e=>choiceCard(e,'crew')).join('')}`;
    el.innerHTML=html;
    bindVotes(el);
    const answered=list.filter(e=>mine(e.id)).length;
    if(status)status.textContent=`${answered}/${list.length} ANSWERED`;
    next.disabled=false;
    next.onclick=()=>stage('confirm');
  };

  function decisionInfo(){
    const members=state.members||[];
    return discussionEvents().map(e=>{
      const votes=(state.votes||[]).filter(v=>v.event_id===e.id);
      const names=status=>votes.filter(v=>v.status===status).map(v=>memberName(v.member_id));
      const yes=names('yes'),maybe=names('maybe'),no=names('no');
      const answered=new Set(votes.map(v=>v.member_id));
      const unanswered=members.filter(m=>!answered.has(m.id)).map(m=>m.name);
      return {e,yes,maybe,no,unanswered,favourite:members.length>0&&!unanswered.length&&!no.length};
    });
  }

  function shareSummary(x){
    const e=x.e;
    const date=new Date(e.date+'T12:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
    const price=e.price!=null?`£${e.price}`:'Price TBC';
    return `🏁 Track Day Heros — ${e.track}\n${date} · ${price}\n\n👍 Yes (${x.yes.length}): ${x.yes.join(', ')||'Nobody'}\n🤔 Maybe (${x.maybe.length}): ${x.maybe.join(', ')||'Nobody'}\n❌ Can’t do (${x.no.length}): ${x.no.join(', ')||'Nobody'}${x.unanswered.length?`\n⏳ No response (${x.unanswered.length}): ${x.unanswered.join(', ')}`:''}\n\nWhat do we reckon?`;
  }

  async function shareDecision(x,button){
    const text=shareSummary(x);
    try{
      if(navigator.share){await navigator.share({title:`${x.e.track} — Track Day Heros`,text});return;}
      await navigator.clipboard.writeText(text);
      const old=button.textContent;button.textContent='Copied — paste into group chat';setTimeout(()=>button.textContent=old,1800);
    }catch(err){if(err?.name!=='AbortError')alert('Could not share this choice: '+err.message);}
  }

  async function confirmSelected(){
    const x=decisionInfo().find(x=>x.e.id===selectedDecisionEventId);
    if(!x)return;
    let warning=`Confirm ${x.e.track} as the group’s track day?`;
    if(x.maybe.length)warning+=`\n\nMaybe: ${x.maybe.join(', ')}`;
    if(x.no.length)warning+=`\nCan’t do: ${x.no.join(', ')}`;
    warning+='\n\nThis should be used after you’ve agreed it in the group chat.';
    if(!window.confirm(warning))return;
    const btn=document.querySelector('#finalConfirmBtn');if(btn)btn.disabled=true;
    try{
      await api('confirm','POST',{groupId:session.groupId,token:session.memberToken,eventId:x.e.id});
      await refreshGroup();
      selectedDecisionEventId='';
      renderTrip();progress();stage('trip');
    }catch(err){alert('Could not confirm track day: '+err.message);renderConfirmation();}
  }

  function decisionCard(x,best){
    const e=x.e,dt=new Date(e.date+'T12:00:00'),price=e.price!=null?`£${e.price}`:'Price TBC';
    const selected=e.id===selectedDecisionEventId;
    return `<article class="card event confirmation-choice ${selected?'selected':''}">
      <div class="datebox"><strong>${dt.getDate()}</strong><span>${dt.toLocaleString('en-GB',{month:'short'}).toUpperCase()} ${dt.getFullYear()}</span></div>
      <div>${x.favourite?`<div class="pill success">⭐ GROUP FAVOURITE${best===e.id?' · 🏆 BEST MATCH':''}</div>`:''}
      <h3>${e.track}</h3><div class="meta">${e.provider} · ${e.format} · ${price}</div>
      <div class="confirmation-breakdown"><div><strong>Yes (${x.yes.length}/${(state.members||[]).length})</strong><span> · ${x.yes.join(', ')||'Nobody'}</span></div><div><strong>Maybe (${x.maybe.length})</strong><span> · ${x.maybe.join(', ')||'Nobody'}</span></div><div><strong>Can’t do (${x.no.length})</strong><span> · ${x.no.join(', ')||'Nobody'}</span></div>${x.unanswered.length?`<div><strong>Needs a response (${x.unanswered.length})</strong><span> · ${x.unanswered.join(', ')}</span></div>`:'<div><strong>✓ Everyone responded</strong></div>'}</div>
      ${x.unanswered.includes(state.me.name)?`<div class="my-availability-badge unmarked">YOUR RESPONSE NEEDED</div>${voteButtons(e)}`:''}
      <div class="vote-row"><button type="button" data-share="${e.id}">Share to group chat</button><button type="button" data-select="${e.id}" class="${selected?'selected':''}">${selected?'Deselect track day':'Confirm this track day'}</button></div></div>
      <div class="score"><strong>${x.yes.length}</strong><span class="meta">yes · ${x.maybe.length} maybe</span></div>
    </article>`;
  }

  function renderConfirmation(){
    const el=document.querySelector('#confirmationList'),confirmBtn=document.querySelector('#finalConfirmBtn'),status=document.querySelector('#confirmationStatus');
    if(!el||!confirmBtn||!state.me)return;
    const info=decisionInfo();
    if(!info.length){el.innerHTML='<div class="card"><h3>No group choices yet.</h3><p class="muted">Choices appear here as the crew starts voting.</p></div>';confirmBtn.disabled=true;return;}
    const favourites=info.filter(x=>x.favourite).sort((a,b)=>b.yes.length-a.yes.length||a.maybe.length-b.maybe.length);
    const best=favourites[0]&&favourites.filter(x=>x.yes.length===favourites[0].yes.length&&x.maybe.length===favourites[0].maybe.length).length===1?favourites[0].e.id:'';
    const live=info.filter(x=>!x.favourite&&!x.no.length),ruled=info.filter(x=>x.no.length);
    if(selectedDecisionEventId&&!info.some(x=>x.e.id===selectedDecisionEventId))selectedDecisionEventId='';
    const section=(title,items)=>items.length?`<div class="choice-section"><span class="eyebrow">${title}</span></div>${items.map(x=>decisionCard(x,best)).join('')}`:'';
    el.innerHTML=`<div class="card"><span class="eyebrow">GROUP STATUS</span><h3>${(state.members||[]).length} in group</h3><p class="muted">Group Favourites are choices everybody has answered and nobody has ruled out.</p></div>${section('GROUP FAVOURITES',favourites)}${section('STILL IN PLAY',live)}${section('RULED OUT',ruled)}`;
    bindVotes(el);
    const byId=new Map(info.map(x=>[x.e.id,x]));
    el.querySelectorAll('[data-share]').forEach(btn=>btn.onclick=()=>shareDecision(byId.get(btn.dataset.share),btn));
    el.querySelectorAll('[data-select]').forEach(btn=>btn.onclick=()=>{selectedDecisionEventId=selectedDecisionEventId===btn.dataset.select?'':btn.dataset.select;renderConfirmation();});
    const selected=byId.get(selectedDecisionEventId);
    confirmBtn.disabled=!selected;
    confirmBtn.textContent=selected?`Confirm ${selected.e.track} →`:'Discuss above, then confirm your choice';
    confirmBtn.onclick=selected?confirmSelected:null;
    if(status)status.textContent=selected?'TRACK DAY SELECTED':favourites.length?`${favourites.length} GROUP FAVOURITE${favourites.length===1?'':'S'}`:'READY TO DISCUSS';
  }

  const heroCopy={
    availability:['Right lads, let’s get the next one booked 🏁','Get your free dates in and we’ll see what lines up.'],
    vote:['Decisions, decisions… 👀','Which ones are you up for?'],
    confirm:["Who’s the awkward one then? 👀","See who’s up for what and find the best fit."],
    trip:["Let’s get it booked! 🏁","Everything you need for the day, all in one place."]
  };

  function updateHero(id){
    const copy=heroCopy[id]||heroCopy.availability;
    const title=document.querySelector('#heroTitle'),text=document.querySelector('#heroText');
    if(title)title.textContent=copy[0];
    if(text)text.textContent=copy[1];
  }

  const baseStage=stage;
  stage=function(id){baseStage(id);updateHero(id);if(id==='vote')renderVotes();if(id==='confirm')renderConfirmation();};
  const baseRender=render;
  render=function(){baseRender();renderConfirmation();};
  document.querySelectorAll('[data-stage]').forEach(btn=>btn.onclick=()=>stage(btn.dataset.stage));
  updateHero('availability');
  if(state.me){renderVotes();renderConfirmation();}
})();