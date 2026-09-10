async function toggleMultiVote(eventId){
  const r=await fetch('/vote-api',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({groupId:session.groupId,token:session.memberToken,eventId})});
  const j=await r.json();
  if(!r.ok)throw new Error(j.error||j.detail||'Vote failed');
  await loadGroup();
}

window.eventCard=function(e,withVote=false){
  const dt=new Date(e.date+'T12:00:00'),score=scoreEvent(e),votes=state.votes.filter(v=>v.event_id===e.id).length;
  const selected=state.votes.some(v=>v.member_id===state.me.id&&v.event_id===e.id);
  const price=e.price!=null?`£${e.price}`:'Price TBC';
  const live=e.live?'LIVE · ':'';
  const stock=e.availability&&e.availability!=='Available'?` · ${e.availability}`:'';
  return `<article class="card event"><div class="datebox"><strong>${dt.getDate()}</strong><span>${dt.toLocaleString('en-GB',{month:'short'}).toUpperCase()} ${dt.getFullYear()}</span></div><div><h3>${e.track}</h3><div class="meta">${live}${e.provider} · ${e.format} · ${price}${stock}</div>${withVote?`<div class="vote-row"><button data-vote="${e.id}" class="${selected?'selected':''}">${selected?'Selected ✓':'I’d do this'}</button></div>`:''}</div><div class="score"><strong>${withVote?votes:score.yes+'/'+score.total}</strong><span class="meta">${withVote?'people interested':score.maybe?`available · ${score.maybe} maybe`:'available'}</span></div></article>`;
};

window.renderVotes=function(){
  const list=shortlist();
  if(!list.length){$('#voteList').innerHTML='<div class="card"><p class="muted">No live events loaded yet.</p></div>';$('#voteStatus').textContent='NO VOTES YET';$('#confirmWinnerBtn').disabled=true;return}
  $('#voteList').innerHTML=list.map(e=>eventCard(e,true)).join('');
  document.querySelectorAll('[data-vote]').forEach(b=>b.onclick=async()=>{try{await toggleMultiVote(b.dataset.vote)}catch(e){alert('Could not update vote: '+e.message)}});
  const voters=new Set(state.votes.map(v=>v.member_id));
  $('#voteStatus').textContent=`${voters.size}/${state.members.length} RESPONDED`;
  const counts={};state.votes.forEach(v=>counts[v.event_id]=(counts[v.event_id]||0)+1);
  const max=Math.max(0,...Object.values(counts));
  const leaders=Object.keys(counts).filter(k=>counts[k]===max&&max>0);
  const winner=leaders.length===1?leaders[0]:'';
  $('#confirmWinnerBtn').disabled=!winner;
  $('#confirmWinnerBtn').dataset.winner=winner;
  if(leaders.length>1)$('#voteStatus').textContent+=` · ${leaders.length}-WAY TIE`;
};
