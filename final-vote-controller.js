(function(){
  function finalVoteRows(){return state.finalVotes||[]}
  function renderFinalVote(){
    const host=document.querySelector('#confirmationList'),btn=document.querySelector('#finalConfirmBtn');
    if(!host||!btn||!state.me)return;
    const members=state.members||[],votes=state.votes||[],name=id=>members.find(m=>m.id===id)?.name||'Unknown';
    const ids=[...new Set(votes.filter(v=>['yes','maybe'].includes(v.status)).map(v=>v.event_id))];
    const favs=ids.map(id=>{const rows=votes.filter(v=>v.event_id===id);return {id,yes:rows.filter(v=>v.status==='yes').length,maybe:rows.filter(v=>v.status==='maybe').length,no:rows.filter(v=>v.status==='no').length,answered:new Set(rows.map(v=>v.member_id)).size}}).filter(x=>x.answered===members.length&&x.no===0);
    if(favs.length<2){return;}
    const eventsById=new Map((events||[]).map(e=>[e.id,e]));
    const final=finalVoteRows(),mine=final.find(v=>v.member_id===state.me.id)?.event_id||'';
    const counts={};final.forEach(v=>counts[v.event_id]=(counts[v.event_id]||0)+1);
    const max=Math.max(0,...favs.map(f=>counts[f.id]||0));
    const leaders=favs.filter(f=>(counts[f.id]||0)===max&&max>0);
    const everyone=final.length>=members.length;
    const winner=everyone&&leaders.length===1?leaders[0].id:'';
    const tied=everyone&&leaders.length>1;
    const section=document.createElement('div');section.id='finalVotePanel';
    section.innerHTML=`<div style="margin:30px 0 10px"><span class="eyebrow">FINAL VOTE</span><h2>Choose the one you want</h2><p class="muted">Everyone gets one vote from the Group Favourites. You can change yours until everybody has voted.</p></div>${favs.map(f=>{const e=eventsById.get(f.id);if(!e)return '';const voters=final.filter(v=>v.event_id===f.id).map(v=>name(v.member_id));return `<article class="card"><h3>${e.track}</h3><div class="meta">${new Date(e.date+'T12:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})} · ${e.price!=null?'£'+e.price:'Price TBC'}</div><div class="vote-row"><button type="button" data-final-vote="${f.id}" class="${mine===f.id?'selected':''}">${mine===f.id?'Your final vote ✓':'Vote for this'}</button></div><p><strong>${counts[f.id]||0} vote${(counts[f.id]||0)===1?'':'s'}</strong>${voters.length?' · '+voters.join(', '):''}</p></article>`}).join('')}<div class="card"><span class="eyebrow">FINAL VOTE STATUS</span><h3>${final.length}/${members.length} voted</h3><p class="muted">${!everyone?'Waiting for '+members.filter(m=>!final.some(v=>v.member_id===m.id)).map(m=>m.name).join(', '):tied?'Tied — change votes or agree which option wins.':winner?'Winner: '+(eventsById.get(winner)?.track||'Selected track day'):''}</p></div>`;
    host.prepend(section);
    section.querySelectorAll('[data-final-vote]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await api('final-vote','POST',{groupId:session.groupId,token:session.memberToken,eventId:b.dataset.finalVote});state=await api('group','GET',{groupId:session.groupId,token:session.memberToken});renderConfirmation();}catch(e){alert('Could not save final vote: '+e.message)}});
    host.querySelectorAll('[data-final-choice]').forEach(b=>{b.closest('.vote-row')?.remove()});
    btn.disabled=!winner;
    btn.textContent=winner?`Confirm ${eventsById.get(winner)?.track||'winning track day'} →`:tied?'Final vote tied':'Waiting for final votes';
    btn.onclick=winner?async()=>{btn.disabled=true;try{await api('confirm','POST',{groupId:session.groupId,token:session.memberToken,eventId:winner});state=await api('group','GET',{groupId:session.groupId,token:session.memberToken});renderTrip();progress();stage('trip')}catch(e){alert('Could not confirm winner: '+e.message);renderConfirmation();}}:null;
  }
  const base=renderConfirmation;
  renderConfirmation=function(){base();renderFinalVote();};
  if(state.me)renderConfirmation();
})();