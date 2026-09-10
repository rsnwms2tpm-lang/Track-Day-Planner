let events=[];
let eventsFetchedAt=0;
let eventsSource='';
let session=JSON.parse(localStorage.getItem('tdp-session')||'null');
let state={group:null,me:null,members:[],availability:[],votes:[],confirmedEventId:null};
let myAvailability={};
let calendarDate=new Date(2026,8,1);
const calendarMin=new Date(2026,8,1);
const calendarMax=new Date(2027,11,1);
const DEFAULT_GROUP_NAME='Track Day Heros 🏁';
const API_BASE='https://uehmbzwnbariqebbxcst.supabase.co/functions/v1/track-day-api';
const venues=['Anglesey','Bedford Autodrome','Blyton Park','Brands Hatch','Cadwell Park','Castle Combe','Croft','Donington Park','Mallory Park','Oulton Park','Snetterton','Spa Francorchamps','Thruxton','Zandvoort'];
const $=s=>document.querySelector(s);
const localToday=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};

async function api(action,method='GET',body=null){
  let url=`${API_BASE}?action=${encodeURIComponent(action)}`;
  if(method==='GET'&&body){for(const [k,v] of Object.entries(body))url+=`&${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`}
  const opts={method,cache:'no-store',headers:{}};
  if(method!=='GET'&&body){opts.headers['content-type']='application/json';opts.body=JSON.stringify(body)}
  const r=await fetch(url,opts);
  let j={};
  try{j=await r.json()}catch{}
  if(!r.ok)throw new Error(j.error||j.detail||`Request failed (${r.status})`);
  return j;
}
function saveSession(){localStorage.setItem('tdp-session',JSON.stringify(session))}
function cleanLiveEvents(raw){
  const map=new Map(),today=localToday();
  for(const item of raw||[]){
    if(!item.date||item.date<today)continue;
    const venue=venues.find(v=>String(item.track||'').toLowerCase().startsWith(v.toLowerCase()));
    if(!venue)continue;
    if(String(item.availability||'').toLowerCase()==='sold out')continue;
    const e={...item,track:venue,id:`${item.provider||'live'}-${item.date}-${venue.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`};
    const key=`${e.date}|${venue}`;
    const old=map.get(key);
    if(!old||(old.price==null&&e.price!=null))map.set(key,e);
  }
  return [...map.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
async function loadEvents(force=false){
  if(!force&&events.length&&Date.now()-eventsFetchedAt<300000)return;
  const r=await api('events');
  events=cleanLiveEvents(r.events||[]);
  eventsSource=r.source||'Live provider';
  eventsFetchedAt=Date.now();
}
function inviteCodeFromLocation(){
  try{return new URLSearchParams(location.search).get('invite')||''}catch{return ''}
}
function onboarding(){
  if(document.querySelector('#onboard'))return;
  const invite=inviteCodeFromLocation();
  const wrap=document.createElement('dialog');
  wrap.id='onboard';
  wrap.innerHTML=`<form id="onboardForm"><span class="eyebrow">${invite?'JOIN THE CREW':'START A REAL GROUP'}</span><h2>Join Track Day Heros 🏁</h2><p class="muted">${invite?'Add your name and car to join the group.':'Add your name and car. The group is already named Track Day Heros 🏁.'}</p><label>Your name<input id="yourName" value="${invite?'':'Dave'}" required maxlength="30" autocomplete="name"></label><label>Your car<input id="yourCar" value="${invite?'':'Clio 172'}" maxlength="50"></label><button class="primary wide" type="submit">${invite?'Join group →':'Continue →'}</button><p id="onboardError" class="muted"></p></form>`;
  document.body.appendChild(wrap);
  wrap.showModal();
  $('#onboardForm').onsubmit=async e=>{
    e.preventDefault();
    const error=$('#onboardError');
    error.textContent='Connecting…';
    try{
      const payload={name:$('#yourName').value.trim(),car:$('#yourCar').value.trim()};
      const res=invite
        ?await api('join-group','POST',{...payload,inviteCode:invite})
        :await api('create-group','POST',{...payload,groupName:DEFAULT_GROUP_NAME});
      session={groupId:res.groupId,memberId:res.memberId,memberToken:res.memberToken};
      saveSession();
      wrap.close();wrap.remove();
      await loadGroup();
    }catch(err){error.textContent=err?.message||'Could not connect'}
  };
}
async function loadGroup(){
  if(!session){onboarding();return}
  try{
    state=await api('group','GET',{groupId:session.groupId,token:session.memberToken});
    myAvailability={};
    (state.availability||[]).filter(a=>a.member_id===state.me.id).forEach(a=>myAvailability[String(a.date).slice(0,10)]=a.status);
    render();
    loadEvents().then(()=>{renderMatches();renderVotes();renderTrip()}).catch(e=>console.error('Live events unavailable',e));
  }catch(e){
    console.error('Could not load saved group',e);
    const el=$('#memberList');
    if(el)el.innerHTML='<p class="muted">Could not load the group just now. Your saved login has been kept — reopen or retry shortly.</p>';
  }
}
let availabilitySaveTimer=null,availabilitySaving=false,availabilityDirty=false;
async function flushAvailability(){
  if(!session||availabilitySaving)return;
  availabilitySaving=true;
  const snapshot={...myAvailability};
  try{
    await api('availability','POST',{groupId:session.groupId,token:session.memberToken,availability:snapshot});
    availabilityDirty=false;
    state.availability=(state.availability||[]).filter(a=>a.member_id!==state.me.id).concat(Object.entries(snapshot).filter(([,v])=>v==='yes'||v==='maybe').map(([date,status])=>({member_id:state.me.id,date,status})));
    renderMembers();renderMatches();renderVotes();
  }catch(e){availabilityDirty=true;console.error('Availability save failed',e)}
  finally{availabilitySaving=false;if(availabilityDirty)scheduleAvailabilitySave()}
}
function scheduleAvailabilitySave(){availabilityDirty=true;clearTimeout(availabilitySaveTimer);availabilitySaveTimer=setTimeout(flushAvailability,450)}
function memberReady(id){return (state.availability||[]).some(a=>a.member_id===id)||(id===state.me?.id&&Object.values(myAvailability).some(Boolean))}
function renderMembers(){
  const el=$('#memberList');if(!el||!state.me)return;
  el.innerHTML=(state.members||[]).map(m=>`<div class="member"><div class="avatar">${(m.name||'?')[0]}</div><div class="member-info"><strong>${m.name}${m.id===state.me.id?' · you':''}</strong><span>${m.car||'Car not set'}</span></div><span class="ready">${memberReady(m.id)?'DATES IN':'WAITING'}</span></div>`).join('');
  const invite=$('#addMemberBtn');if(invite){invite.textContent='+ Invite driver';invite.onclick=inviteDriver}
}
const dayLetters=['M','T','W','T','F','S','S'];
function monthKey(y,m,d){return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`}
function renderCalendar(){
  const el=$('#calendar');if(!el)return;
  el.replaceChildren();
  const y=calendarDate.getFullYear(),m=calendarDate.getMonth();
  const daysInMonth=new Date(y,m+1,0).getDate();
  const offset=(new Date(y,m,1).getDay()+6)%7;
  const canPrev=calendarDate.getTime()>calendarMin.getTime();
  const canNext=calendarDate.getTime()<calendarMax.getTime();
  const head=document.createElement('div');head.className='calendar-head';
  const prev=document.createElement('button');prev.type='button';prev.textContent='←';prev.disabled=!canPrev;
  const title=document.createElement('strong');title.textContent=calendarDate.toLocaleString('en-GB',{month:'long',year:'numeric'});
  const next=document.createElement('button');next.type='button';next.textContent='→';next.disabled=!canNext;
  head.append(prev,title,next);el.appendChild(head);
  const sub=document.createElement('div');sub.className='calendar-sub';sub.innerHTML='<span class="muted">tap: yes → maybe → clear</span>';el.appendChild(sub);
  const grid=document.createElement('div');grid.className='calendar-grid';
  for(const label of dayLetters){const d=document.createElement('div');d.className='dow';d.textContent=label;grid.appendChild(d)}
  for(let i=0;i<offset;i++){const empty=document.createElement('span');empty.className='day empty';grid.appendChild(empty)}
  for(let d=1;d<=daysInMonth;d++){
    const key=monthKey(y,m,d),status=myAvailability[key]||'';
    const btn=document.createElement('button');btn.type='button';btn.className=`day ${status}`.trim();btn.textContent=String(d);btn.dataset.date=key;
    btn.addEventListener('click',()=>{const old=myAvailability[key];const nextStatus=old==='yes'?'maybe':old==='maybe'?'':'yes';if(nextStatus)myAvailability[key]=nextStatus;else delete myAvailability[key];btn.classList.remove('yes','maybe');if(nextStatus)btn.classList.add(nextStatus);scheduleAvailabilitySave()});
    grid.appendChild(btn);
  }
  el.appendChild(grid);
  prev.onclick=()=>{if(canPrev){calendarDate=new Date(y,m-1,1);renderCalendar()}};
  next.onclick=()=>{if(canNext){calendarDate=new Date(y,m+1,1);renderCalendar()}};
}
function scoreEvent(e){const yes=new Set((state.availability||[]).filter(a=>String(a.date).slice(0,10)===e.date&&a.status==='yes').map(a=>a.member_id));const maybe=new Set((state.availability||[]).filter(a=>String(a.date).slice(0,10)===e.date&&a.status==='maybe').map(a=>a.member_id));return {yes:yes.size,maybe:maybe.size,total:(state.members||[]).length}}
function eventCard(e,withVote=false){
  const dt=new Date(e.date+'T12:00:00'),score=scoreEvent(e),votes=(state.votes||[]).filter(v=>v.event_id===e.id).length,selected=(state.votes||[]).some(v=>v.member_id===state.me?.id&&v.event_id===e.id),mine=myAvailability[e.date]||'';
  const price=e.price!=null?`£${e.price}`:'Price TBC',stock=e.availability&&e.availability!=='Available'?` · ${e.availability}`:'';
  const badge=withVote?`<div class="my-availability-badge ${mine||'unmarked'}">${mine==='yes'?'✓ YOU MARKED THIS DATE AVAILABLE':mine==='maybe'?'? YOU MARKED THIS DATE MAYBE':'— YOU DID NOT MARK THIS DATE AVAILABLE'}</div>`:'';
  return `<article class="card event"><div class="datebox"><strong>${dt.getDate()}</strong><span>${dt.toLocaleString('en-GB',{month:'short'}).toUpperCase()} ${dt.getFullYear()}</span></div><div><h3>${e.track}</h3><div class="meta">${e.live?'LIVE · ':''}${e.provider} · ${e.format} · ${price}${stock}</div>${badge}${withVote?`<div class="vote-row"><button data-vote="${e.id}" class="${selected?'selected':''}">${selected?'Selected ✓':'I’d do this'}</button></div>`:''}</div><div class="score"><strong>${withVote?votes:score.yes+'/'+score.total}</strong><span class="meta">${withVote?'people interested':score.maybe?`available · ${score.maybe} maybe`:'available'}</span></div></article>`;
}
function planningStart(){const dates=(state.availability||[]).map(a=>String(a.date).slice(0,10)).filter(Boolean).sort();return dates[0]||localToday()}
function rankedEvents(){const start=planningStart();return [...events].filter(e=>e.date>=start).sort((a,b)=>{const sa=scoreEvent(a),sb=scoreEvent(b);return sb.yes-sa.yes||sb.maybe-sa.maybe||a.date.localeCompare(b.date)})}
function shortlist(){return rankedEvents().slice(0,6)}
function renderMatches(){const el=$('#matchList');if(!el)return;if(!events.length){el.innerHTML='<div class="card"><h3>Loading live listings…</h3><p class="muted">Your group is ready while we check providers.</p></div>';return}const list=shortlist();el.innerHTML=list.map(e=>eventCard(e)).join('')}
async function toggleVote(eventId){await api('vote','POST',{groupId:session.groupId,token:session.memberToken,eventId});await loadGroup()}
function renderVotes(){
  const el=$('#voteList');if(!el)return;const list=shortlist();
  if(!list.length){el.innerHTML='<div class="card"><p class="muted">Live events are still loading.</p></div>';if($('#voteStatus'))$('#voteStatus').textContent='';if($('#confirmWinnerBtn'))$('#confirmWinnerBtn').disabled=true;return}
  el.innerHTML=list.map(e=>eventCard(e,true)).join('');
  el.querySelectorAll('[data-vote]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await toggleVote(b.dataset.vote)}catch(e){alert('Could not update vote: '+e.message)}});
  const voters=new Set((state.votes||[]).map(v=>v.member_id));const counts={};(state.votes||[]).forEach(v=>counts[v.event_id]=(counts[v.event_id]||0)+1);const max=Math.max(0,...Object.values(counts)),leaders=Object.keys(counts).filter(k=>counts[k]===max&&max>0),winner=leaders.length===1?leaders[0]:'';
  $('#voteStatus').textContent=`${voters.size}/${(state.members||[]).length} RESPONDED${leaders.length>1?` · ${leaders.length}-WAY TIE`:''}`;$('#confirmWinnerBtn').disabled=!winner;$('#confirmWinnerBtn').dataset.winner=winner;
}
function renderTrip(){const el=$('#tripSummary');if(!el)return;const e=events.find(x=>x.id===state.confirmedEventId)||events[0];if(!e){el.innerHTML='<div class="card"><p class="muted">Live events are still loading.</p></div>';return}el.innerHTML=`<div class="trip-grid"><div class="card"><span class="eyebrow">TRACK DAY</span><h2>${e.track}</h2><p>${new Date(e.date+'T12:00:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})} · ${e.provider} · ${e.price!=null?'£'+e.price:'Price TBC'}</p><span class="pill success">${state.confirmedEventId?'TRACK CONFIRMED':'AWAITING CONFIRMATION'}</span></div><div class="card"><span class="eyebrow">CREW</span><h3>${(state.members||[]).length} driver${(state.members||[]).length===1?'':'s'} in group</h3>${(state.members||[]).map(m=>`<div class="attendance-row"><span>${m.name}</span><span class="meta">${m.car||''}</span></div>`).join('')}</div></div>`}
function progress(){if(!$('#progressValue'))return;const p=state.confirmedEventId?100:(state.votes||[]).length?70:(state.availability||[]).length?35:10;$('#progressValue').textContent=p+'%'}
function render(){if(!state.me)return;renderMembers();renderCalendar();renderMatches();renderVotes();renderTrip();progress();if($('.topbar h1'))$('.topbar h1').textContent=DEFAULT_GROUP_NAME;const reset=$('#resetBtn');if(reset){reset.textContent='Leave group';reset.onclick=()=>{if(confirm('Leave this group on this phone?')){localStorage.removeItem('tdp-session');location.reload()}}}}
async function inviteDriver(){const link=`${location.origin}${location.pathname}?invite=${encodeURIComponent(state.group.invite_code)}`;try{if(navigator.share)await navigator.share({title:DEFAULT_GROUP_NAME,text:'Join our track-day group',url:link});else{await navigator.clipboard.writeText(link);alert('Invite link copied')}}catch(e){if(e.name!=='AbortError')prompt('Copy this invite link:',link)}}
function stage(id){document.querySelectorAll('.stage,.steps button').forEach(x=>x.classList.remove('active'));$('#'+id)?.classList.add('active');document.querySelector(`[data-stage="${id}"]`)?.classList.add('active');scrollTo({top:250,behavior:'smooth'})}
document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>stage(b.dataset.stage));
$('#findBtn').onclick=async()=>{if(availabilityDirty)await flushAvailability();try{state=await api('group','GET',{groupId:session.groupId,token:session.memberToken});myAvailability={};state.availability.filter(a=>a.member_id===state.me.id).forEach(a=>myAvailability[String(a.date).slice(0,10)]=a.status);render();stage('vote');await loadEvents(true);renderVotes();renderTrip()}catch(e){alert('Could not refresh choices: '+e.message)}};
$('#confirmWinnerBtn').onclick=async e=>{await api('confirm','POST',{groupId:session.groupId,token:session.memberToken,eventId:e.currentTarget.dataset.winner});await loadGroup();stage('trip')};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&availabilityDirty)flushAvailability()});
loadGroup();