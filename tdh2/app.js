"use strict";
const API_ROOT="https://uehmbzwnbariqebbxcst.supabase.co/functions/v1";
const PROVIDER_WEBSITES={"opentrack":"https://opentrack.co.uk/view-dates","javelin":"https://javelintrackdays.co.uk/trackdays/Upcoming-Events","msv trackdays":"https://shop.msv.com/Calendar/Trackday/Car/List","gold track":"https://www.goldtrack.co.uk/","motorsport events":"https://www.motorsport-events.com/collections/all"};
const SOURCES=[{name:"Javelin · MSV · OpenTrack · Gold Track",url:API_ROOT+"/track-day-events"},{name:"Motorsport Events",url:API_ROOT+"/motorsport-events-feed"}];
const CIRCUITS=["Anglesey","Bedford Autodrome","Blyton Park","Brands Hatch","Cadwell Park","Castle Combe","Croft","Donington Park","Goodwood","Knockhill","Llandow","Mallory Park","Oulton Park","Pembrey","Silverstone","Snetterton","Thruxton"];
const ALIASES=[["anglesey",["anglesey","trac mon","trac môn"]],["bedford autodrome",["bedford"]],["blyton park",["blyton"]],["brands hatch",["brands hatch"]],["cadwell park",["cadwell"]],["castle combe",["castle combe"]],["croft",["croft"]],["donington park",["donington"]],["goodwood",["goodwood"]],["knockhill",["knockhill"]],["llandow",["llandow"]],["mallory park",["mallory"]],["oulton park",["oulton"]],["pembrey",["pembrey"]],["silverstone",["silverstone"]],["snetterton",["snetterton"]],["thruxton",["thruxton"]]];
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const safeText=v=>String(v??"");
const esc=v=>safeText(v).replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
const storageKey="tdh2-planner-v1";
let state;
try{state=JSON.parse(localStorage.getItem(storageKey)||"null")||{}}catch{state={}};
state.months=state.months||{};state.interests=state.interests||{};state.booked=state.booked||{};state.eventCache=state.eventCache||{};state.savedInterestedEvents=state.savedInterestedEvents||{};
let year=2027,chosen=null,allEvents=[],lastSearchMonth="",sourceMessages=[];

const CREW_API=API_ROOT+"/tdh2-planner";
const CREW_KEY="tdh2-single-workspace-v1";
let crewSession=null,crewData=null,crewMonth="",crewSummary=null,crewSummaryYear=0;
let selectedAvatar="",avatarType="driver",crewSyncTimers={};
try{
 const saved=JSON.parse(localStorage.getItem(CREW_KEY)||"null");
 if(saved?.groupId&&saved?.memberToken)crewSession={groupId:saved.groupId,memberId:saved.memberId,memberToken:saved.memberToken};
}catch{}
function activeCrew(){return !!(crewSession&&crewData?.me)}
function eventKey(e){return e.savedEventId||(e.interestedMemberIds?e.id:eventId(e))}
function namedCrewInterest(e){
 const id=eventKey(e);
 const row=crewData?.events?.find(x=>x.id===id);
 if(!row)return [];
 return (crewData.members||[]).filter(m=>row.interestedMemberIds.includes(m.id));
}
function memberInterested(e){return activeCrew()?namedCrewInterest(e).some(m=>m.id===crewData.me.id):!!state.interests[eventKey(e)]}
function crewAvatarElement(el,member){
 if(!el)return;
 const name=member?.name||"?";
 const size=el.classList.contains("large")?50:el.classList.contains("mini")?47:30;
 const image=window.TDHAvatars?.avatarImage(member?.avatar,size);
 el.replaceChildren();
 el.style.backgroundImage="none";
 if(image){
   const img=document.createElement("img");
   img.src=image.src;
   img.alt="";
   img.decoding="async";
   img.draggable=false;
   img.className="crew-avatar-sprite";
   img.style.width=image.width+"px";
   img.style.height=image.height+"px";
   img.style.left=image.left+"px";
   img.style.top=image.top+"px";
   el.append(img);
 }else el.textContent=name.charAt(0).toUpperCase();
}
function renderHeaderCrew(){
 const me=crewData?.me;
 $("#crewHeaderName").textContent=me?.name||"Your profile";
 $("#crewMenuName").textContent=me?.name||"Your profile";
 $("#crewMenuCar").textContent=me?me.car||"Car not set":"Create your TDH profile";
 crewAvatarElement($("#crewAvatar"),me);
 crewAvatarElement($("#crewMenuAvatar"),me);
 $("#crewInviteButton").disabled=false;
}
function crewStatus(message){$("#crewMenuStatus").textContent=message}
function dialogStatus(message){$("#crewDialogStatus").textContent=message}
async function crewRequest(action,options={},useGet=false){
 if(!crewSession)throw Error("Set up your TDH crew profile first.");
 const auth={groupId:crewSession.groupId,token:crewSession.memberToken};
 const url=useGet?CREW_API+"?"+new URLSearchParams({...auth,...options,action}):CREW_API;
 const request=useGet?{}:{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...auth,...options,action})};
 const response=await fetch(url,{cache:"no-store",...request});
 const data=await response.json();
 if(!response.ok)throw Error(data.error||"Crew connection failed");
 return data;
}
function setCrewMonth(data,key){
 if(chosen!==key)return;
 crewData=data;crewMonth=key;
 const mine=data.dates.filter(d=>d.member_id===data.me.id).map(d=>String(d.available_date).slice(0,10));
 monthState(key).dates=mine;
 save();
 renderHeaderCrew();renderDates();renderResults();renderMonths();
}
async function fetchCrewMonth(key){
 if(!crewSession)return;
 try{
  let data=await crewRequest("state",{month:key});
  // Fresh crew: never import old identities or device-only interests.
  if(chosen===key)setCrewMonth(data,key);
  await fetchCrewSummary(year);
 }catch(e){
  console.warn("Crew month failed",e);
  crewStatus("Could not sync crew selections: "+e.message);
 }
}
async function fetchCrewSummary(y){
 if(!crewSession||y<2026||y>2032)return;
 try{
  const response=await crewRequest("summary",{year:y});
  if(year===y){crewSummary=response.months;crewSummaryYear=y;renderMonths();}
 }catch(e){console.warn("Crew summary unavailable",e)}
}
function queueDateSync(key){
 if(!crewSession||!activeCrew())return;
 clearTimeout(crewSyncTimers[key]);
 crewSyncTimers[key]=setTimeout(async()=>{
  const dates=[...monthState(key).dates];
  try{
   const data=await crewRequest("dates",{month:key,dates});
   if(chosen===key)setCrewMonth(data,key);
   await fetchCrewSummary(year);
  }catch(e){console.warn("Crew date save failed",e);$("#searchStatus").textContent="Date changes were not synced: "+e.message;}
 },400);
}
function fillAvatars(){
 const root=$("#crewAvatarOptions");root.innerHTML="";
 $("#crewDialog").querySelectorAll("[data-avatar-type]").forEach(b=>b.classList.toggle("active",b.dataset.avatarType===avatarType));
 for(const a of window.TDHAvatars?.all.filter(x=>x.type===avatarType)||[]){
  const b=document.createElement("button");b.type="button";b.className="crew-avatar-option"+(a.id===selectedAvatar?" selected":"");b.setAttribute("aria-pressed",String(a.id===selectedAvatar));
  const img=document.createElement("span");img.className="crew-avatar mini";crewAvatarElement(img,{name:a.name,avatar:a.id});
  const caption=document.createElement("span");caption.textContent=a.name;
  b.append(img,caption);b.onclick=()=>{selectedAvatar=a.id;fillAvatars()};
  root.append(b);
 }
}
function openProfileDialog(){
 $("#crewMenu").hidden=true;$("#crewMenuButton").setAttribute("aria-expanded","false");
 const me=crewData?.me;
 const joining=!me;
 $("#crewDialogTitle").textContent=joining?"Your TDH profile":"Edit your profile";
 $("#crewDialogDescription").textContent=joining?"Enter your name, car and choose an avatar. You're automatically part of TDH.":"Update your own name, car or avatar.";
 $("#crewNameInput").value=me?.name||"";
 $("#crewCarInput").value=me?.car||"";
 selectedAvatar=me?.avatar||"";
 avatarType=selectedAvatar.startsWith("helmet-")?"helmet":"driver";
 $("#crewSaveButton").textContent="SAVE PROFILE";
 $("#crewSaveButton").disabled=false;
 dialogStatus("");
 fillAvatars();$("#crewDialog").showModal();
}
async function saveCrewProfile(){
 const name=$("#crewNameInput").value.trim(),car=$("#crewCarInput").value.trim();
 if(name.length<2){dialogStatus("Please enter a name of at least two characters.");return}
 const b=$("#crewSaveButton");b.disabled=true;dialogStatus("Saving…");
 try{
  if(!crewSession){
   const response=await fetch(CREW_API,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"register",name,car,avatar:selectedAvatar})});
   const data=await response.json();if(!response.ok)throw Error(data.error||"Could not save your profile");
   crewSession={groupId:data.groupId,memberId:data.memberId,memberToken:data.memberToken};
   localStorage.setItem(CREW_KEY,JSON.stringify(crewSession));
   crewData={me:data.me,members:[data.me],dates:[],events:[]};crewMonth="";
   if(history.replaceState)history.replaceState({},document.title,location.pathname);
  }else{
   await crewRequest("profile",{name,car,avatar:selectedAvatar});
   if(crewData){crewData.me={...crewData.me,name,car,avatar:selectedAvatar};crewData.members=(crewData.members||[]).map(m=>m.id===crewData.me.id?{...m,name,car,avatar:selectedAvatar}:m);}
  }
  renderHeaderCrew();$("#crewDialog").close();
  if(chosen)await fetchCrewMonth(chosen);else await fetchCrewSummary(year);
 }catch(e){dialogStatus(e.message)}finally{b.disabled=false}
}
async function copyCrewInvite(){
 const link=location.origin+location.pathname;
 const button=$("#crewInviteButton");
 button.disabled=true;crewStatus("Copying TDH link…");
 try{
  if(!navigator.clipboard?.writeText)throw Error("Clipboard unavailable");
  await navigator.clipboard.writeText(link);
  crewStatus("TDH link copied. Send it to your mates.");
  $("#crewInviteFallback").hidden=true;
 }catch{
  const field=$("#crewInviteFallback");
  field.hidden=false;field.value=link;field.focus();field.select();
  crewStatus("Copy this TDH link and send it to your mates.");
 }finally{button.disabled=false}
}
async function initialiseCrew(){
 renderHeaderCrew();
 if(!crewSession){
  openProfileDialog();
  return;
 }
 try{
  const key=chosen||monthKey(year,0);
  const data=await crewRequest("state",{month:key});
  crewData=data;crewMonth=key;
  renderHeaderCrew();
  if(chosen)await fetchCrewMonth(chosen);
  await fetchCrewSummary(year);
 }catch(e){
  crewStatus("Could not connect: "+e.message);
  console.warn("Crew initialisation failed",e);
 }
}

const nowISO=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")};
const monthKey=(y,m)=>y+"-"+String(m+1).padStart(2,"0");
function save(){try{localStorage.setItem(storageKey,JSON.stringify(state))}catch(e){console.warn("Could not store planning data",e)}}
function monthState(k){return state.months[k]||(state.months[k]={dates:[],circuits:[]})}
function standardTrack(n){const raw=safeText(n).toLowerCase();const match=ALIASES.find(([,aliases])=>aliases.some(a=>raw.includes(a)));return match?.[0]||raw.replace(/\s+/g," ").trim()}
function canonical(e){const track=standardTrack(e.track);const provider=safeText(e.provider||"Unknown").toLowerCase().trim();const date=safeText(e.date).slice(0,10);const layout=safeText(e.layout||"").trim().toLowerCase();const fmt=safeText(e.format||"").trim().toLowerCase();return [provider,date,track,layout,fmt].join("|")}
function cleanEvents(items){const map=new Map();for(const e of items){if(!/^20\d{2}-\d{2}-\d{2}$/.test(e.date||"")||!e.track)continue;const track=standardTrack(e.track);if(!CIRCUITS.some(c=>c.toLowerCase()===track))continue;const normalized={...e,track:CIRCUITS.find(c=>c.toLowerCase()===track),date:e.date.slice(0,10)};const key=canonical(normalized);const old=map.get(key);if(!old||(old.price==null&&normalized.price!=null))map.set(key,normalized)}return [...map.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.track.localeCompare(b.track)||safeText(a.provider).localeCompare(safeText(b.provider)))}
function eventId(e){return canonical(e)}
function organiserLink(e){const url=safeText(e?.sourceUrl||"");return /^https:\/\/[^\s]+$/i.test(url)?{url,exact:true}:{url:PROVIDER_WEBSITES[safeText(e?.provider).toLowerCase()]||"",exact:false}}

function cachedEvents(k){
  const cache=state.eventCache[k];
  return Array.isArray(cache?.events)?cache.events:[];
}
function selectedEvents(k){
  const known=new Map();
  if(activeCrew()&&crewMonth===k){
    for(const e of crewData.events||[]){
      if(e.interestedMemberIds?.length||e.bookedMemberIds?.length)known.set(e.id,{...e,savedEventId:e.id});
    }
  }
  // First recover the complete records saved by newer versions of the app.
  for(const e of [...cachedEvents(k),...Object.values(state.savedInterestedEvents)]) {
    if(!activeCrew()&&e?.date?.startsWith(k)&&state.interests[eventId(e)])known.set(eventId(e),e);
  }
  // Older TDH 2.0 versions stored only the event key, not the event data.
  // Reconstruct a minimal card instead of forcing a new live search.
  for(const [id,interested] of Object.entries(state.interests)){
    if(activeCrew()||!interested||known.has(id))continue;
    const parts=id.split("|");
    if(parts.length!==5||!/^20\d{2}-\d{2}-\d{2}$/.test(parts[1])||!parts[1].startsWith(k))continue;
    const track=CIRCUITS.find(c=>c.toLowerCase()===parts[2])||parts[2];
    const provider=parts[0].replace(/\b\w/g,ch=>ch.toUpperCase());
    const event={date:parts[1],track,provider,layout:parts[3],format:parts[4],price:null,availability:"Check organiser for latest availability",recovered:true};
    // Preserve the precise original key; no normalisation guessing for identity.
    known.set(id,{...event,savedEventId:id});
  }
  return [...known.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.track.localeCompare(b.track));
}
function showSavedMonth(){
  allEvents=cachedEvents(chosen);
  lastSearchMonth=state.eventCache[chosen]?chosen:"";
  const cache=state.eventCache[chosen];
  $("#searchStatus").textContent=cache
    ?"Previously found "+allEvents.length+" events · Search again to refresh"
    :"";
}
function setTab(tab){$$("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));$$("[data-panel]").forEach(p=>p.hidden=p.dataset.panel!==tab);if(tab==="booked"){renderBooked();refreshBooked();}}
const metricIcons={
 dates:'<svg viewBox="0 0 24 24" fill="none" stroke="#fa902d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 15l2 2 5-5"/></svg>',
 interest:'<svg viewBox="0 0 24 24" fill="none" stroke="#c1cbd4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5"/></svg>',
 booked:'<svg viewBox="0 0 24 24" fill="none" stroke="#8de4b6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 22V3m0 1c5-3 8 3 15 0v11c-7 3-10-3-15 0"/></svg>'
};
function bookedCountForMonth(key){
 return Object.values(state.booked||{}).filter(e=>e&&e.date&&safeText(e.date).startsWith(key)&&(e.booked===true||e.confirmed===true||e.status==="booked")).length;
}
function renderMonths(){
 $("#yearHeading").textContent=year+" calendar";
 $("#heroYear").textContent=year;
 const months=$("#months");months.innerHTML="";
 for(let i=0;i<12;i++){
  const key=monthKey(year,i),month=monthState(key);
  const localDates=month.dates.filter(d=>d.startsWith(key+"-")).length;
  const yearData=activeCrew()&&crewSummaryYear===year?crewSummary?.[key]:null;
  const dates=chosen===key?localDates:yearData?yearData.myDates:localDates;
  const otherInterests=yearData?yearData.crewInterests:null;
  const booked=yearData?yearData.bookedEvents:0;
  const button=document.createElement("button");
  button.type="button";
  button.className="month"+(chosen===key?" selected":"");
  const monthName=new Intl.DateTimeFormat("en-GB",{month:"long"}).format(new Date(year,i,1));
  button.setAttribute("aria-label",monthName+" "+year+", "+dates+" dates selected, "+(otherInterests===null?"crew interests not loaded":otherInterests+" events the crew is interested in")+", "+booked+" booked events");
  button.innerHTML='<div class="month-top"><span class="name">'+monthName+'</span><span class="month-arrow" aria-hidden="true">↗</span></div>'+
  '<div class="month-metrics">'+
   '<div class="month-metric">'+metricIcons.dates+'<span>'+(dates?dates+' dates selected':'<span class="muted">No dates selected</span>')+'</span></div>'+
   '<div class="month-metric">'+metricIcons.interest+'<span class="muted">Crew interests '+(otherInterests===null?"—":otherInterests)+'</span></div>'+
   '<div class="month-metric">'+metricIcons.booked+'<span class="'+(booked?"booked":"muted")+'">'+(booked?booked+' booked '+(booked===1?"event":"events"):'Nothing booked')+'</span></div>'+
  '</div>';
  button.onclick=()=>openMonth(key);months.append(button);
 }
}
function shortMonth(key){const [y,m]=key.split("-").map(Number);return new Intl.DateTimeFormat("en-GB",{month:"short"}).format(new Date(y,m-1,1))}
function adjacentMonth(key,step){const [y,m]=key.split("-").map(Number);return monthKey(y,m-1+step)}
function updateMonthNavigation(){
 const prev=adjacentMonth(chosen,-1),next=adjacentMonth(chosen,1);
 $("#previousMonthLabel").textContent=shortMonth(prev);
 $("#followingMonthLabel").textContent=shortMonth(next);
 $("#previousMonth").disabled=Number(prev.slice(0,4))<2026;
 $("#followingMonth").disabled=Number(next.slice(0,4))>2032;
 $("#previousMonth").setAttribute("aria-label","Previous month: "+shortMonth(prev)+" "+prev.slice(0,4));
 $("#followingMonth").setAttribute("aria-label","Next month: "+shortMonth(next)+" "+next.slice(0,4));
}
function openMonth(key){
 chosen=key;
 const [y,m]=key.split("-").map(Number);
 year=y;
 $("#seasonView").hidden=true;$("#monthPanel").hidden=false;
 $("#monthHeading").textContent=new Intl.DateTimeFormat("en-GB",{month:"long",year:"numeric"}).format(new Date(y,m-1,1));
 updateMonthNavigation();renderMonths();renderDates();showSavedMonth();renderResults();fetchCrewMonth(key);
 $("#sourceStatus").innerHTML="";
 window.scrollTo({top:0,behavior:"smooth"});
}
function renderDates(){if(!chosen)return;const [y,m]=chosen.split("-").map(Number),s=monthState(chosen),start=(new Date(y,m-1,1).getDay()+6)%7,last=new Date(y,m,0).getDate();const grid=$("#dateGrid");grid.innerHTML="";for(const wd of ["M","T","W","T","F","S","S"]){const label=document.createElement("div");label.className="weekday";label.textContent=wd;grid.append(label)}for(let i=0;i<start;i++){const blank=document.createElement("span");blank.className="day blank";grid.append(blank)}for(let d=1;d<=last;d++){const date=chosen+"-"+String(d).padStart(2,"0"),b=document.createElement("button");b.textContent=d;b.className="day"+(s.dates.includes(date)?" selected":"")+(date<nowISO()?" past":"");b.type="button";b.setAttribute("aria-pressed",String(s.dates.includes(date)));b.setAttribute("aria-label",date);b.onclick=()=>{s.dates=s.dates.includes(date)?s.dates.filter(x=>x!==date):[...s.dates,date].sort();save();renderDates();renderMonths();renderResults();queueDateSync(chosen)};grid.append(b)}updateDateAction();showCrewAvailability(grid)}

function showCrewAvailability(grid){
 const info=$("#crewAvailabilityInfo");
 info.hidden=true;info.innerHTML="";
 if(!activeCrew()||crewMonth!==chosen)return;
 const counts=new Map();
 const names=new Map(crewData.members.map(m=>[m.id,m.name]));
 for(const d of crewData.dates){
  const key=String(d.available_date).slice(0,10);
  const list=counts.get(key)||[];
  list.push(names.get(d.member_id)||"Crew member");counts.set(key,list);
 }
 for(const button of grid.querySelectorAll("button.day")){
  const key=button.getAttribute("aria-label"),people=counts.get(key)||[];
  if(!people.length)continue;
  button.title="Available: "+people.join(", ");
  button.setAttribute("aria-label",key+"; available: "+people.join(", "));
  const count=document.createElement("span");count.className="crew-day-count";count.textContent=people.length;button.append(count);
 }
 const everyone=crewData.members.map(m=>{
  const count=crewData.dates.filter(d=>d.member_id===m.id).length;
  return esc(m.name)+": "+count+" date"+(count===1?"":"s");
 });
 info.innerHTML="<strong>CREW AVAILABILITY</strong><p>"+everyone.join(" · ")+"</p>";
 info.hidden=false;
}

function updateDateAction(){
  if(!chosen)return;
  const [y,m]=chosen.split("-").map(Number);
  const count=new Date(y,m,0).getDate();
  const btn=$("#selectAllDates");
  const selected=monthState(chosen).dates.filter(d=>d.startsWith(chosen+"-")).length;
  btn.textContent=selected===count?"CLEAR ALL":"SELECT ALL";
  btn.setAttribute("aria-label",selected===count?"Clear all dates for this month":"Select all dates for this month");
}
function status(name,ok,count,error){const el=document.createElement("span");el.textContent=name+": "+(ok?count+" listings":"unavailable"+(error?" · "+error:""));$("#sourceStatus").append(el)}
async function getSource(source){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),18000);try{const r=await fetch(source.url,{cache:"no-store",signal:controller.signal});if(!r.ok)throw Error("HTTP "+r.status);const json=await r.json();if(json.error)throw Error(safeText(json.error));return {name:source.name,ok:true,events:Array.isArray(json.events)?json.events:[],details:Array.isArray(json.sources)?json.sources:[]}}catch(e){return{name:source.name,ok:false,events:[],error:e.name==="AbortError"?"timeout":e.message}}finally{clearTimeout(timer)}}
async function search(){if(!chosen)return;const btn=$("#search"),k=chosen;btn.disabled=true;$("#searchStatus").textContent="Searching "+new Intl.DateTimeFormat("en-GB",{month:"long",year:"numeric"}).format(new Date(Number(k.slice(0,4)),Number(k.slice(5,7))-1,1))+"…";$("#sourceStatus").innerHTML="";try{const feeds=await Promise.all(SOURCES.map(getSource));const ok=feeds.some(f=>f.ok);if(ok){allEvents=cleanEvents(feeds.flatMap(f=>f.events)).filter(e=>e.date.startsWith(k));lastSearchMonth=k;state.eventCache[k]={events:allEvents,updatedAt:new Date().toISOString()};for(const e of allEvents){if(state.interests[eventId(e)])state.savedInterestedEvents[eventId(e)]=e}save()}for(const f of feeds){const monthCount=f.events.filter(e=>safeText(e.date).startsWith(k)).length;status(f.name,f.ok,monthCount,f.error)}$("#searchStatus").textContent=ok?resultsForMonth().length+" matching events in "+new Intl.DateTimeFormat("en-GB",{month:"long",year:"numeric"}).format(new Date(Number(k.slice(0,4)),Number(k.slice(5,7))-1,1)):"Search unavailable · try again later";renderResults();}finally{btn.disabled=false}}
function resultsForMonth(){if(!chosen||lastSearchMonth!==chosen)return[];const s=monthState(chosen);return allEvents.filter(e=>e.date.startsWith(chosen)&&(!s.dates.length||s.dates.includes(e.date)))}
function renderResults(){
  const root=$("#results");
  root.innerHTML="";
  if(!chosen)return;
  const saved=selectedEvents(chosen);
  const matches=resultsForMonth();
  const shown=new Set();
  const section=(heading,detail)=>{
    const wrapper=document.createElement("div");
    wrapper.className="results-section";
    const h=document.createElement("h3");h.className="results-title";h.textContent=heading;wrapper.append(h);
    if(detail){const p=document.createElement("p");p.className="muted";p.textContent=detail;wrapper.append(p)}
    root.append(wrapper);
  };
  function card(e){
    const id=eventKey(e),mine=memberInterested(e),box=document.createElement("article");
    box.className="event";
    const date=new Date(e.date+"T12:00:00");
    const price=e.price==null?(e.recovered?"Details saved before update":"Price not listed"):"£"+Number(e.price).toFixed(0);
    const destination=organiserLink(e);const link=destination.url?'<a target="_blank" rel="noopener noreferrer" href="'+esc(destination.url)+'">'+(destination.exact?"Official listing ↗":"Organiser website ↗")+'</a>':"";
    box.innerHTML='<div class="datebox"><strong>'+date.getDate()+'</strong><span>'+new Intl.DateTimeFormat("en-GB",{month:"short"}).format(date).toUpperCase()+'</span></div><div class="content"><h3>'+esc(e.track)+'</h3><p class="meta">'+esc(e.provider||"Organiser unknown")+' · '+esc(price)+' · '+esc(e.availability||"Availability unknown")+'</p><div class="bottom"><span class="tag">'+esc(e.format||"Track day")+'</span>'+link+'<button type="button" class="'+(mine?"on":"")+'" data-interest>'+(mine?"✓ Interested":"I'm interested")+'</button></div></div>';
    const bookingIds=(crewMonth===chosen&&crewData?.events?.find(row=>row.id===id)?.bookedMemberIds)||[];
    const myBooking=!!crewData?.me&&bookingIds.includes(crewData.me.id);
    const bookedNames=(crewData?.members||[]).filter(m=>bookingIds.includes(m.id)).map(m=>m.name);
    const actions=box.querySelector(".bottom");
    if((mine||myBooking)&&activeCrew()){
      const bookedButton=document.createElement("button");
      bookedButton.type="button";
      bookedButton.className="event-book-button"+(myBooking?" booked":"");
      bookedButton.textContent=myBooking?"✓ I'm Booked":"⚑ I'm Booked";
      bookedButton.title=myBooking?"Remove only your own booking":"Confirm your own place on this track day";
      bookedButton.onclick=async()=>{
        if(myBooking&&!confirm("Remove your booking for "+e.track+"? Other crew bookings will remain."))return;
        bookedButton.disabled=true;
        try{
          const key=chosen;
          const updated=await crewRequest("book",{month:key,eventId:id,booked:!myBooking});
          if(chosen===key){crewData=updated;crewMonth=key;renderResults();}
          await Promise.all([fetchCrewSummary(year),refreshBooked()]);
        }catch(error){alert("Could not update booking: "+error.message);bookedButton.disabled=false;}
      };
      actions.append(bookedButton);
    }
    if(bookedNames.length){
      const confirmed=document.createElement("p");
      confirmed.className="confirmed-names";
      confirmed.textContent="Booked: "+bookedNames.join(", ");
      box.querySelector(".content").append(confirmed);
    }
    const names=namedCrewInterest(e).map(x=>x.name);
    if(names.length){
      const who=document.createElement("p");who.className="interested-crew";
      who.textContent="Interested: "+names.join(", ");
      box.querySelector(".content").append(who);
    }
    box.querySelector("[data-interest]").onclick=async ev=>{
      const button=ev.currentTarget;
      if(!crewSession){
        openProfileDialog();
        return;
      }
      button.disabled=true;
      try{
        const targetMonth=chosen;
        const updated=await crewRequest("interest",{month:targetMonth,interested:!mine,event:{...e,id,sourceUrl:organiserLink(e).url}});
        if(targetMonth===chosen){crewData=updated;crewMonth=targetMonth;}
        if(!mine){state.interests[id]=true;state.savedInterestedEvents[id]=e;}
        else{delete state.interests[id];delete state.savedInterestedEvents[id];}
        save();renderResults();renderMonths();await fetchCrewSummary(year);
      }catch(error){
        alert("Could not save interest to crew: "+error.message);
        button.disabled=false;
      }
    };
    root.append(box);shown.add(id);
  }
  if(saved.length){
    section(activeCrew()?"Crew interested & booked events":"Your interested events",activeCrew()?"Shared across the crew. Booked events stay visible here too.":"Your earlier saved interests appear here. Join the crew to share future selections.");
    saved.forEach(card);
  }
  const other=matches.filter(e=>!shown.has(eventId(e)));
  if(lastSearchMonth===chosen){
    if(other.length){
      section("Other matching events",other.length+" events on your chosen dates.");
      other.forEach(card);
    }else if(!saved.length){
      const note=document.createElement("p");note.className="note";
      note.textContent="No events match this month and the selected dates. Choose more dates or clear the selection, or search again for updated listings.";
      root.append(note);
    }
  }else if(!saved.length){
    const note=document.createElement("p");note.className="note";
    note.textContent="Select dates, or leave them unselected to search the whole month. Your interested events will appear here whenever you return.";
    root.append(note);
  }
}

let bookedData=null,bookedLoading=false,expandedBooked=null,editingPlanId=null,addingPlanKind=null,activeTripTab="accommodation",stayModeChoice="shared",stayFilter="all",stayEditing=null,stayFormOpen=false;
const PLAN_FIELDS={
 accommodation:[
  ["place","Place / accommodation","text","Hotel, Airbnb, campsite…"],
  ["address","Address","text","Address for directions"],
  ["url","Booking / accommodation link","url","https://…"],
  ["arrival","Check-in","date",""],
  ["departure","Check-out","date",""],
  ["cost","Cost / split (optional)","text","e.g. £180 total, split three ways"],
  ["notes","Notes","textarea","Rooms, parking, payment, access…"]
 ],
 trailers:[
  ["location","Trailer location","select","At the circuit|Elsewhere|Not decided"],
  ["address","Address / exact location","text","Location or parking area"],
  ["notes","Notes","textarea","Who has which trailer, access, keys…"]
 ],
 travel:[
  ["departureDate","Departure date","date",""],
  ["departureTime","Departure time","time",""],
  ["from","Leaving from","text","Home, Cornwall Services…"],
  ["destination","Going to","select","Circuit|Accommodation|Other"],
  ["address","Destination address","text","Address for navigation"],
  ["notes","Notes","textarea","Meet-up location, convoy, stops…"]
 ]
};
const PLAN_LABEL={accommodation:"Accommodation",trailers:"Trailers",travel:"Travel"};
function safeExternalLink(raw){
 try{const u=new URL(raw);return ["https:","http:"].includes(u.protocol)?u.href:""}catch{return ""}
}
function wazeLink(address){return "https://waze.com/ul?q="+encodeURIComponent(address)+"&navigate=yes"}
function humanDate(date){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(safeText(date)))return safeText(date);
 return new Intl.DateTimeFormat("en-GB",{weekday:"short",day:"numeric",month:"long",year:"numeric"}).format(new Date(date+"T12:00:00"));
}
async function refreshBooked(){
 if(!crewSession)return;
 bookedLoading=true;
 if(!bookedData)renderBooked();
 try{
  bookedData=await crewRequest("booked");
  renderBooked();
 }catch(error){
  $("#bookedStatus").textContent="Could not load the shared bookings: "+error.message;
 }finally{bookedLoading=false}
}
function bookedPerson(member){
 const row=document.createElement("span");row.className="booked-person";
 const avatar=document.createElement("span");avatar.className="crew-avatar";
 crewAvatarElement(avatar,member);
 const name=document.createElement("span");name.textContent=member.name;
 row.append(avatar,name);return row;
}
function detailText(kind,details){
 const parts=[];
 if(kind==="accommodation"){
  if(details.place)parts.push(details.place);
  if(details.mode)parts.push(details.mode==="shared"?"Shared stay":"Individual stay");
  if(details.arrival||details.departure)parts.push([details.arrival||"?",details.departure||"?"].join(" – "));
  if(details.cost)parts.push(details.cost);
  if(!details.mode&&details.sharing)parts.push("Sharing: "+details.sharing);
 }else if(kind==="trailers"){
  if(details.location)parts.push(details.location);
 }else{
  if(details.departureDate||details.departureTime)parts.push([details.departureDate,details.departureTime].filter(Boolean).join(" · "));
  if(details.from||details.destination)parts.push([details.from,details.destination].filter(Boolean).join(" → "));
 }
 return parts.join(" · ");
}

function stayText(tag,cls,value){
 const el=document.createElement(tag);if(cls)el.className=cls;el.textContent=value;return el;
}
async function doStayChange(action,event,payload,button){
 if(button)button.disabled=true;
 try{await crewRequest(action,{eventId:event.id,...payload});await refreshBooked();}
 catch(err){alert("Could not save accommodation: "+err.message);if(button)button.disabled=false;}
}
function renderAccommodationOption(event,opt){
 const card=document.createElement("article");card.className="stay-option-card";
 const mode=opt.mode==="shared"?"All Together":"Individual";
 const member=(bookedData.members||[]).find(m=>m.id===opt.memberId);
 const header=document.createElement("div");header.className="stay-option-head";
 const left=document.createElement("div");left.append(stayText("h4","stay-option-name",opt.name));
 left.append(stayText("p","stay-option-meta",mode+" · Added by "+(member?.name||"Crew member")));
 const price=stayText("span","stay-option-price",opt.price||"Price not added");header.append(left,price);card.append(header);
 if(opt.imageUrl){
  try{
   const u=new URL(opt.imageUrl);
   if(u.protocol==="https:"){
    const img=document.createElement("img");img.className="stay-option-image";img.src=u.toString();img.alt="Photo of "+opt.name;img.loading="lazy";img.referrerPolicy="no-referrer";card.append(img);
   }
  }catch{}
 }

 if(opt.notes)card.append(stayText("p","stay-option-notes",opt.notes));
 if(opt.arrival||opt.departure)card.append(stayText("p","stay-option-meta",[opt.arrival||"?",opt.departure||"?"].join(" – ")));
 if(opt.address)card.append(stayText("p","stay-option-meta",opt.address));
 const listing=safeExternalLink(opt.url);
 if(listing){const link=document.createElement("a");link.href=listing;link.target="_blank";link.rel="noopener noreferrer";link.className="stay-option-link";link.textContent="View accommodation listing ↗";card.append(link);}
 const who=document.createElement("div");who.className="stay-option-people";
 const iNames=(bookedData.members||[]).filter(m=>opt.interestedMemberIds.includes(m.id)).map(m=>m.name);
 const bNames=(bookedData.members||[]).filter(m=>opt.bookedMemberIds.includes(m.id)).map(m=>m.name);
 if(iNames.length)who.append(stayText("p","stay-option-interested","Interested: "+iNames.join(", ")));
 if(bNames.length)who.append(stayText("p","stay-option-confirmed","Booked: "+bNames.join(", ")));
 if(who.childNodes.length)card.append(who);
 const choices=document.createElement("div");choices.className="stay-option-choices";
 for(const [kind,label,selected,action] of [
  ["interested","Interested",opt.interestedMemberIds.includes(bookedData.meId),"stayChoice"],
  ["booked","Mark booked",opt.bookedMemberIds.includes(bookedData.meId),"stayChoice"]]){
  const button=document.createElement("button");button.type="button";
  button.className="stay-choice "+kind+(selected?" on":"");
  button.textContent=selected?(kind==="booked"?"✓ Booked":"✓ Interested"):label;
  button.setAttribute("aria-pressed",String(selected));
  button.onclick=()=>doStayChange(action,event,{optionId:opt.id,choice:kind,value:!selected},button);
  choices.append(button);
 }
 card.append(choices);
 if(opt.memberId===bookedData.meId){
  const tools=document.createElement("div");tools.className="stay-option-tools";
  const edit=document.createElement("button");edit.type="button";edit.textContent="Edit option";
  edit.onclick=()=>{stayEditing=opt.id;stayFormOpen=true;renderBooked()};
  const remove=document.createElement("button");remove.type="button";remove.textContent="Remove option";
  remove.onclick=()=>{if(confirm("Remove this accommodation suggestion and its crew selections?"))doStayChange("stayDelete",event,{optionId:opt.id},remove)};
  tools.append(edit,remove);card.append(tools);
 }
 return card;
}
function renderStayOptionForm(event){
 const opt=event.stayOptions.find(o=>o.id===stayEditing);
 const form=document.createElement("form");form.className="stay-option-form";
 form.append(stayText("h4","",""+(opt?"Edit accommodation option":"Add accommodation option")));
 form.append(stayText("p","stay-option-meta","Share a place you're considering. No one is assigned to it."));
 const mode=document.createElement("div");mode.className="stay-mode-options";
 let currentMode=opt?.mode||"shared";
 for(const [value,label] of [["shared","All Together"],["individual","Individual"]]){
  const b=document.createElement("button");b.type="button";b.className="stay-mode-option"+(currentMode===value?" active":"");b.textContent=label;
  b.onclick=()=>{currentMode=value;for(const child of mode.children)child.classList.toggle("active",child===b)};
  mode.append(b);
 }
 form.append(mode);
 const items=[
  ["url","Accommodation link","url","Paste an Airbnb or Booking.com link",false],
  ["name","Name (optional)","text","e.g. Cottage near circuit",false],
  ["price","Price (optional)","text","£260 total / £75 per room",false],
  ["notes","Notes (optional)","textarea","Beds, parking, distance to circuit…",false],
  ["address","Address (optional; for Waze)","text","Address for navigation",false],
  ["arrival","Check-in (optional)","date","",false],
  ["departure","Check-out (optional)","date","",false]
 ];
 const hint=stayText("p","stay-quick-hint","Paste a link and save. Everything else can be added later.");
 form.append(hint);
 const extras=document.createElement("details");extras.className="stay-optional-details";
 const summary=document.createElement("summary");summary.textContent="Add name, price or other details (optional)";
 extras.append(summary);
 if(opt)extras.open=true;
 for(const [key,label,type,placeholder,required] of items){
  const field=document.createElement("label");field.className="trip-field";
  field.append(stayText("span","",label));
  const input=document.createElement(type==="textarea"?"textarea":"input");
  if(type!=="textarea")input.type=type;else input.rows=3;
  input.name=key;input.placeholder=placeholder;input.required=required;input.value=opt?.[key]||"";
  field.append(input);
  (key==="url"?form:extras).append(field);
 }
 form.append(extras);

 let previewImageUrl=opt?.imageUrl||"";
 const urlInput=form.elements.namedItem("url");
 const lookupArea=document.createElement("div");lookupArea.className="stay-lookup-area";
 const lookupButton=document.createElement("button");lookupButton.type="button";lookupButton.className="stay-lookup-button";lookupButton.textContent="✧ Look up Airbnb details";
 const lookupMessage=stayText("p","stay-lookup-message","");lookupMessage.setAttribute("role","status");
 const preview=document.createElement("div");preview.className="stay-lookup-preview";preview.hidden=true;
 lookupArea.append(lookupButton,lookupMessage,preview);
 urlInput.closest(".trip-field").after(lookupArea);
 const isAirbnb=url=>{try{const u=new URL(url);return u.protocol==="https:"&&/^(?:[a-z0-9-]+\.)*airbnb\.(?:co\.uk|com|[a-z]{2,3})$/.test(u.hostname.toLowerCase())}catch{return false}};
 function updateLookupButton(){
  const supported=isAirbnb(urlInput.value.trim());
  lookupButton.hidden=!supported;
  if(!supported){lookupMessage.textContent="";preview.hidden=true}
 }
 urlInput.addEventListener("input",()=>{previewImageUrl=opt?.url===urlInput.value.trim()?opt.imageUrl||"":"";updateLookupButton();});
 lookupButton.onclick=async()=>{
  const url=urlInput.value.trim();
  if(!isAirbnb(url))return;
  lookupButton.disabled=true;lookupButton.textContent="Looking up Airbnb…";lookupMessage.textContent="Checking public listing details…";preview.hidden=true;
  try{
   const result=await crewRequest("stayLookup",{url});
   if(urlInput.value.trim()!==url)return;
   if(!result?.ok){lookupMessage.textContent=result?.error||"No details found. You can still save the link.";return}
   const nameInput=form.elements.namedItem("name");
   const notesInput=form.elements.namedItem("notes");
   if(result.name&&!nameInput.value.trim())nameInput.value=result.name;
   if(result.description&&!notesInput.value.trim())notesInput.value=result.description;
   previewImageUrl=result.imageUrl||"";
   preview.replaceChildren();
   if(previewImageUrl){const img=document.createElement("img");img.src=previewImageUrl;img.alt="Airbnb listing preview";img.referrerPolicy="no-referrer";img.loading="lazy";preview.append(img)}
   preview.append(stayText("strong","",result.name||"Airbnb accommodation"));
   if(result.description)preview.append(stayText("p","stay-option-meta",result.description.slice(0,220)));
   preview.hidden=false;
   lookupMessage.textContent="Found some listing details. Review or edit them before saving.";
   extras.open=true;
  }catch(err){lookupMessage.textContent="Couldn't get a preview. You can still save the link."}
  finally{lookupButton.disabled=false;lookupButton.textContent="✧ Look up Airbnb details"}
 };
 updateLookupButton();
 const status=stayText("p","trip-form-status","");status.setAttribute("role","status");form.append(status);
 const actions=document.createElement("div");actions.className="trip-form-actions";
 const save=document.createElement("button");save.className="trip-save";save.type="submit";save.textContent=opt?"Save changes":"Add to shortlist";
 const cancel=document.createElement("button");cancel.type="button";cancel.textContent="Cancel";cancel.onclick=()=>{stayEditing=null;stayFormOpen=false;renderBooked()};
 actions.append(save,cancel);form.append(actions);
 form.onsubmit=async ev=>{
  ev.preventDefault();save.disabled=true;status.textContent="Saving…";
  const values={mode:currentMode,imageUrl:previewImageUrl};
  for(const [key] of items)values[key]=form.elements.namedItem(key).value.trim();
  try{
   const url=values.url;
   if(!url&&!values.name)throw Error("Paste a link or enter a name for this option.");
   if(url&&!safeExternalLink(url))throw Error("Enter a valid accommodation link.");
   await crewRequest("staySave",{eventId:event.id,optionId:opt?.id||null,...values});
   stayEditing=null;stayFormOpen=false;await refreshBooked();
  }catch(error){status.textContent=error.message;save.disabled=false;}
 };
 return form;
}

const STAY_BEDS_KEY="tdh2-accommodation-beds-v1";
const staySearchSessions=new Map();
function savedBedCount(){
 try{const n=Number(localStorage.getItem(STAY_BEDS_KEY));return Number.isInteger(n)&&n>=1&&n<=20?n:3}
 catch{return 3}
}
let stayBedCount=savedBedCount();
function isoOffset(value,days){
 const d=new Date(value+"T12:00:00Z");
 if(Number.isNaN(d.getTime()))return "";
 d.setUTCDate(d.getUTCDate()+days);
 return d.toISOString().slice(0,10);
}
function accommodationSearchSettings(event){
 let settings=staySearchSessions.get(event.id);
 if(!settings){
  settings={arrival:isoOffset(event.date,-1),departure:isoOffset(event.date,1),mode:"shared"};
  staySearchSessions.set(event.id,settings);
 }
 return settings;
}
function staySearchUrl(provider,event,settings){
 const place=event.track+", United Kingdom";
 const checkin=settings.arrival,checkout=settings.departure;
 const beds=stayBedCount;
 if(provider==="airbnb"){
  const slug=encodeURIComponent(place).replace(/%20/g,"-");
  const params=new URLSearchParams({checkin,checkout,adults:String(beds),min_beds:String(beds)});
  return "https://www.airbnb.co.uk/s/"+slug+"/homes?"+params;
 }
 const params=new URLSearchParams({
  ss:place,checkin,checkout,group_adults:String(beds),
  no_rooms:String(settings.mode==="individual"?beds:1),group_children:"0",lang:"en-gb"
 });
 return "https://www.booking.com/searchresults.html?"+params;
}
function renderStaySearch(event){
 const settings=accommodationSearchSettings(event);
 const finder=document.createElement("section");finder.className="accommodation-search";
 const heading=stayText("h3","","Find accommodation");finder.append(heading);
 finder.append(stayText("p","stay-option-meta","Search near "+event.track+" · two nights by default (before and after the track day)."));
 const dates=document.createElement("div");dates.className="stay-search-dates";
 for(const [key,label] of [["arrival","Check-in"],["departure","Check-out"]]){
  const wrapper=document.createElement("label");wrapper.className="trip-field";
  wrapper.append(stayText("span","",label));
  const input=document.createElement("input");input.type="date";input.value=settings[key];input.name=key;input.required=true;
  input.addEventListener("change",()=>{settings[key]=input.value;updateLinks()});
  wrapper.append(input);dates.append(wrapper);
 }
 finder.append(dates);
 const modeTitle=stayText("p","stay-search-label","Accommodation type");finder.append(modeTitle);
 const modes=document.createElement("div");modes.className="stay-mode-options";
 for(const [value,label] of [["shared","All Together"],["individual","Individual"]]){
  const b=document.createElement("button");b.type="button";b.className="stay-mode-option"+(settings.mode===value?" active":"");b.textContent=label;
  b.onclick=()=>{settings.mode=value;for(const child of modes.children)child.classList.toggle("active",child===b);updateLinks()};
  modes.append(b);
 }
 finder.append(modes);
 const bedRow=document.createElement("div");bedRow.className="stay-bed-row";
 const bedCopy=document.createElement("div");bedCopy.append(stayText("strong","","Beds needed"),stayText("p","stay-option-meta","Total beds, including any passengers"));
 const bedControls=document.createElement("div");bedControls.className="stay-bed-controls";
 const down=document.createElement("button");down.type="button";down.textContent="−";down.setAttribute("aria-label","One fewer bed");
 const count=stayText("strong","stay-bed-count",String(stayBedCount));count.setAttribute("aria-live","polite");
 const up=document.createElement("button");up.type="button";up.textContent="+";up.setAttribute("aria-label","One more bed");
 function setBeds(n){stayBedCount=Math.max(1,Math.min(20,n));try{localStorage.setItem(STAY_BEDS_KEY,String(stayBedCount))}catch{}count.textContent=String(stayBedCount);down.disabled=stayBedCount<=1;up.disabled=stayBedCount>=20;updateLinks()}
 down.onclick=()=>setBeds(stayBedCount-1);up.onclick=()=>setBeds(stayBedCount+1);
 bedControls.append(down,count,up);bedRow.append(bedCopy,bedControls);finder.append(bedRow);
 const status=stayText("p","stay-search-validation","");status.setAttribute("role","status");finder.append(status);
 finder.append(stayText("p","stay-option-meta","Booking.com uses guests and rooms rather than beds. Check its room configuration after opening; Airbnb receives a minimum-bed filter."));
 const links=document.createElement("div");links.className="stay-search-links";
 const anchors=[];
 for(const [label,provider] of [["Booking.com","booking"],["Airbnb","airbnb"]]){
  const link=document.createElement("a");link.className="stay-search-provider";link.textContent="⌕  "+label+" ↗";link.target="_blank";link.rel="noopener noreferrer";
  link.addEventListener("click",e=>{if(!valid()){e.preventDefault();status.textContent="Choose a check-out date after check-in before searching.";}});
  anchors.push([link,provider]);links.append(link);
 }
 finder.append(links);
 function valid(){return !!settings.arrival&&!!settings.departure&&settings.departure>settings.arrival;}
 function updateLinks(){
  const ok=valid();status.textContent=ok?"":"Check-out must be after check-in.";
  for(const [link,provider] of anchors){
   link.href=ok?staySearchUrl(provider,event,settings):"#";
   link.classList.toggle("disabled",!ok);link.setAttribute("aria-disabled",String(!ok));
  }
 }
 down.disabled=stayBedCount<=1;up.disabled=stayBedCount>=20;
 updateLinks();
 return finder;
}

function renderAccommodation(event){
 const section=document.createElement("section");section.className="trip-section accommodation-shortlist";
 const options=event.stayOptions||[];
 const heading=document.createElement("div");heading.className="trip-section-heading";
 heading.append(stayText("h3","","Accommodation"),stayText("span","trip-section-count",options.length+" options"));
 section.append(heading,stayText("p","stay-shortlist-intro","Share places you've found. Compare them here, then decide what works in the group chat."));
 const filters=document.createElement("div");filters.className="stay-filters";
 for(const [value,label] of [["all","All"],["shared","All Together"],["individual","Individual"]]){
  const button=document.createElement("button");button.type="button";
  button.className=stayFilter===value?"active":"";button.textContent=label;
  button.onclick=()=>{stayFilter=value;renderBooked()};filters.append(button);
 }
 section.append(filters);
 const list=document.createElement("div");list.className="trip-entries";
 for(const o of options.filter(x=>stayFilter==="all"||x.mode===stayFilter))list.append(renderAccommodationOption(event,o));
 if(!list.children.length)list.append(stayText("p","trip-empty",options.length?"No options in this category yet.":"No places suggested yet. Add an Airbnb or hotel to start the shortlist."));
 section.append(list);
 if(stayFormOpen){section.append(renderStayOptionForm(event))}
 else{const button=document.createElement("button");button.type="button";button.className="trip-add";button.textContent="+ Add accommodation option";button.onclick=()=>{stayEditing=null;stayFormOpen=true;renderBooked()};section.append(button);}
 const confirmed=[...options.filter(o=>o.bookedMemberIds.length)];
 const legacy=event.plans.filter(p=>p.kind==="accommodation");
 if(confirmed.length||legacy.length){
  const confirmedSection=document.createElement("section");confirmedSection.className="stay-confirmed-section";
  confirmedSection.append(stayText("h3","","✓ Confirmed stays"));
  for(const o of confirmed){
   const card=document.createElement("div");card.className="stay-confirmed-entry";
   card.append(stayText("strong","",o.name));
   card.append(stayText("p","stay-option-meta",(o.mode==="shared"?"All Together":"Individual")+" · "+(bookedData.members||[]).filter(m=>o.bookedMemberIds.includes(m.id)).map(m=>m.name).join(", ")));
   if(o.address){const link=document.createElement("a");link.href=wazeLink(o.address);link.target="_blank";link.rel="noopener noreferrer";link.textContent="Waze directions ↗";card.append(link);}
   else card.append(stayText("p","trip-empty","Add an address to this option to enable Waze."));
   confirmedSection.append(card);
  }
  for(const p of legacy){
   const card=document.createElement("div");card.className="stay-confirmed-entry";
   const owner=bookedData.members.find(m=>m.id===p.member_id);
   card.append(stayText("strong","",p.details?.place||"Existing accommodation"));
   card.append(stayText("p","stay-option-meta","Previously saved by "+(owner?.name||"crew member")));
   if(p.details?.address){const a=document.createElement("a");a.href=wazeLink(p.details.address);a.target="_blank";a.rel="noopener noreferrer";a.textContent="Waze directions ↗";card.append(a);}
   confirmedSection.append(card);
  }
  section.append(confirmedSection);
 }
 section.append(renderStaySearch(event));
 return section;
}

function renderPlanSection(event,kind){
 const wrapper=document.createElement("section");wrapper.className="trip-section";
 wrapper.innerHTML='<div class="trip-section-heading"><h3>'+PLAN_LABEL[kind]+'</h3><span class="trip-section-count">'+event.plans.filter(p=>p.kind===kind).length+' entries</span></div>';
 const list=document.createElement("div");list.className="trip-entries";
 for(const plan of event.plans.filter(p=>p.kind===kind)){
  const member=(bookedData?.members||[]).find(m=>m.id===plan.member_id)||{name:"Crew member"};
  const entry=document.createElement("div");entry.className="trip-entry";entry.dataset.planId=plan.id;
  const by=document.createElement("div");by.className="trip-entry-by";by.append(bookedPerson(member));
  entry.append(by);
  const summary=detailText(kind,plan.details||{});
  if(summary){const title=document.createElement("p");title.className="trip-entry-main";title.textContent=summary;entry.append(title);}
  if(plan.details?.address){const p=document.createElement("p");p.className="trip-detail";p.textContent=plan.details.address;entry.append(p);}
  if(plan.details?.notes){const p=document.createElement("p");p.className="trip-detail";p.textContent=plan.details.notes;entry.append(p);}
  const links=document.createElement("div");links.className="trip-entry-actions";
  const url=safeExternalLink(plan.details?.url);
  if(url){const a=document.createElement("a");a.href=url;a.target="_blank";a.rel="noopener noreferrer";a.textContent="Open accommodation ↗";links.append(a);}
  const destination=plan.details?.address;
  if(destination){
   const a=document.createElement("a");a.href=wazeLink(destination);a.target="_blank";a.rel="noopener noreferrer";a.textContent="Waze directions ↗";links.append(a);
  }
  if(plan.member_id===bookedData?.meId){
   const edit=document.createElement("button");edit.type="button";edit.textContent="Edit";edit.onclick=()=>{addingPlanKind=kind;editingPlanId=plan.id;renderBooked()};links.append(edit);
   const del=document.createElement("button");del.type="button";del.className="trip-remove";del.textContent="Remove";
   del.onclick=async()=>{
    if(!confirm("Remove your "+PLAN_LABEL[kind].toLowerCase()+" entry?"))return;
    del.disabled=true;
    try{await crewRequest("planDelete",{planId:plan.id});editingPlanId=null;addingPlanKind=null;await refreshBooked();}
    catch(error){alert("Could not remove arrangement: "+error.message);del.disabled=false;}
   };links.append(del);
  }
  entry.append(links);list.append(entry);
 }
 if(kind==="accommodation"){
  for(const entry of list.children){
   const planId=entry.dataset.planId;
   const plan=event.plans.find(p=>p.id===planId);
   if(!plan)continue;
   const details=plan.details||{};
   const ids=Array.isArray(details.guests)?details.guests:[];
   const guests=(bookedData.members||[]).filter(m=>ids.includes(m.id)).map(m=>m.name);
   const sharing=details.mode==="shared"?"All together"+(guests.length?" · "+guests.join(", "):""):details.mode==="separate"?"Separate stay":details.sharing?"Sharing: "+details.sharing:"";
   if(sharing){const line=document.createElement("p");line.className="trip-detail shared-guests";line.textContent=sharing;entry.append(line);}
  }
 }
 if(!list.children.length){const empty=document.createElement("p");empty.className="trip-empty";empty.textContent="Nothing arranged yet.";list.append(empty);}
 wrapper.append(list);

 if(kind==="travel"){
  const destinations=document.createElement("div");destinations.className="waze-destinations";
  const heading=document.createElement("h4");heading.textContent="Navigate with Waze";destinations.append(heading);
  const options=document.createElement("div");options.className="waze-destination-grid";
  const circuit=document.createElement("a");circuit.className="waze-destination circuit";
  circuit.href=wazeLink(event.track+" race circuit, United Kingdom");circuit.target="_blank";circuit.rel="noopener noreferrer";
  circuit.textContent="⚑ To Circuit ↗";options.append(circuit);
  const stays=[...event.plans.filter(p=>p.kind==="accommodation"&&p.details?.address),...(event.stayOptions||[]).filter(o=>o.bookedMemberIds?.length&&o.address).map(o=>({details:{place:o.name,address:o.address}}))];
  for(const p of stays){
   const a=document.createElement("a");a.className="waze-destination";a.href=wazeLink(p.details.address);
   a.target="_blank";a.rel="noopener noreferrer";
   a.textContent="⌂ "+(p.details.place||"Accommodation")+" ↗";options.append(a);
  }
  if(!stays.length){const hint=document.createElement("p");hint.className="trip-empty";hint.textContent="Save an accommodation address to add its Waze button automatically.";options.append(hint);}
  destinations.append(options);wrapper.append(destinations);
 }
 if(kind==="accommodation"){
  const finder=document.createElement("div");finder.className="accommodation-finder";
  const heading=document.createElement("span");heading.textContent="Find somewhere nearby";finder.append(heading);
  const links=document.createElement("div");links.className="trip-entry-actions";
  const place=encodeURIComponent(event.track+", United Kingdom");
  for(const [name,url] of [["Booking.com","https://www.booking.com/searchresults.html?ss="+place],["Airbnb","https://www.airbnb.co.uk/s/"+place+"/homes"]]){
   const a=document.createElement("a");a.href=url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=name+" ↗";links.append(a);
  }
  finder.append(links);wrapper.append(finder);
 }
 if(addingPlanKind===kind&&expandedBooked===event.id){
  const form=renderPlanForm(event,kind,editingPlanId);wrapper.append(form);
 }else{
  const add=document.createElement("button");add.type="button";add.className="trip-add";
  add.textContent="+ Add "+PLAN_LABEL[kind].toLowerCase()+" details";
  add.onclick=()=>{addingPlanKind=kind;editingPlanId=null;renderBooked()};
  wrapper.append(add);
 }
 return wrapper;
}
function renderPlanForm(event,kind,planId){
 const plan=planId?event.plans.find(p=>p.id===planId):null;
 const form=document.createElement("form");form.className="trip-form";
 const h=document.createElement("h4");h.textContent=plan?"Edit your arrangement":"Add "+PLAN_LABEL[kind].toLowerCase();form.append(h);
 if(kind==="accommodation"){
  stayModeChoice=plan?.details?.mode||stayModeChoice||"shared";
  const picker=document.createElement("div");picker.className="stay-mode-picker";
  const tip=document.createElement("p");tip.textContent="How are you staying? You can have shared and separate stays on the same trip.";picker.append(tip);
  const choices=document.createElement("div");choices.className="stay-mode-options";picker.append(choices);
  const guests=document.createElement("fieldset");guests.className="stay-guest-picker";guests.name="guestPicker";
  const legend=document.createElement("legend");legend.textContent="Who's staying together?";guests.append(legend);
  const renderChoice=()=>{
   choices.replaceChildren();
   for(const [mode,label,iconText] of [["shared","All together","♧"],["separate","Separate","◉"]]){
    const button=document.createElement("button");button.type="button";
    button.className="stay-mode-option"+(stayModeChoice===mode?" active":"");
    button.setAttribute("aria-pressed",String(stayModeChoice===mode));
    button.textContent=iconText+"  "+label;
    button.onclick=()=>{stayModeChoice=mode;renderChoice();guests.hidden=mode!=="shared"};
    choices.append(button);
   }
  };
  for(const member of bookedData.members.filter(m=>event.bookedMemberIds.includes(m.id))){
   const label=document.createElement("label");label.className="stay-guest-checkbox";
   const input=document.createElement("input");input.type="checkbox";input.value=member.id;input.name="guest";
   input.checked=(Array.isArray(plan?.details?.guests)?plan.details.guests.includes(member.id):member.id===bookedData.meId);
   if(member.id===bookedData.meId){input.checked=true;input.disabled=true;}
   const text=document.createElement("span");text.textContent=member.name;label.append(input,text);guests.append(label);
  }
  renderChoice();guests.hidden=stayModeChoice!=="shared";picker.append(guests);form.append(picker);
 }
 const fields=PLAN_FIELDS[kind];
 for(const [key,label,type,placeholder] of fields){
  const group=document.createElement("label");group.className="trip-field";
  const text=document.createElement("span");text.textContent=label;group.append(text);
  let input;
  if(type==="textarea"){input=document.createElement("textarea");input.rows=3;input.placeholder=placeholder;}
  else if(type==="select"){
   input=document.createElement("select");
   const blank=document.createElement("option");blank.value="";blank.textContent="Choose…";input.append(blank);
   for(const value of placeholder.split("|")){const o=document.createElement("option");o.value=value;o.textContent=value;input.append(o);}
  }else{input=document.createElement("input");input.type=type;input.placeholder=placeholder;}
  input.name=key;input.value=plan?.details?.[key]||"";group.append(input);form.append(group);
 }
 const status=document.createElement("p");status.className="trip-form-status";status.setAttribute("role","status");form.append(status);
 const buttons=document.createElement("div");buttons.className="trip-form-actions";
 const saveBtn=document.createElement("button");saveBtn.type="submit";saveBtn.className="trip-save";saveBtn.textContent="Save arrangement";
 const cancel=document.createElement("button");cancel.type="button";cancel.textContent="Cancel";cancel.onclick=()=>{addingPlanKind=null;editingPlanId=null;renderBooked()};
 buttons.append(saveBtn,cancel);form.append(buttons);
 form.onsubmit=async ev=>{
  ev.preventDefault();saveBtn.disabled=true;status.textContent="Saving…";
  const details={};for(const [key] of fields)details[key]=form.elements.namedItem(key)?.value||"";
  if(kind==="accommodation"){
   details.mode=stayModeChoice;
   details.guests=stayModeChoice==="shared"?[bookedData.meId,...[...form.querySelectorAll('input[name="guest"]:checked')].map(x=>x.value)]:[bookedData.meId];
   details.guests=[...new Set(details.guests)];
   // Keep any free-text sharing notes saved with entries from the previous layout.
   if(plan?.details?.sharing)details.sharing=plan.details.sharing;
  }
  try{
   await crewRequest("planSave",{eventId:event.id,kind,planId:planId||null,details});
   addingPlanKind=null;editingPlanId=null;
   await refreshBooked();
  }catch(error){status.textContent=error.message;saveBtn.disabled=false;}
 };
 return form;
}

function renderBooked(){
 const panel=$('[data-panel="booked"]');
 const list=$("#bookedList");list.replaceChildren();
 const status=$("#bookedStatus");status.textContent="";
 const event=bookedData?.events?.find(x=>x.id===expandedBooked);
 if(expandedBooked&&!event){expandedBooked=null;addingPlanKind=null;editingPlanId=null;}
 const viewingTrip=!!(expandedBooked&&event);
 panel.classList.toggle("trip-page-active",viewingTrip);
 if(!crewSession){status.textContent="Set up your profile to see the crew's bookings.";return;}
 if(!bookedData){status.textContent=bookedLoading?"Loading bookings…":"Open Booked to load your crew's trips.";return;}
 if(!bookedData.events.length){
  const empty=document.createElement("p");empty.className="note";
  empty.textContent="Nothing booked yet. Find an event in Planner and select I'm Booked.";
  list.append(empty);return;
 }
 if(!viewingTrip){
  for(const item of bookedData.events){
   const article=document.createElement("article");article.className="booked-event booked-overview-card";
   const button=document.createElement("button");button.type="button";button.className="booked-event-toggle";
   button.innerHTML='<span class="booked-event-date">'+esc(humanDate(item.date))+'</span><span class="booked-event-name">'+esc(item.track)+'</span><span class="booked-event-meta">'+esc(item.provider||"Track day")+' · '+item.bookedMemberIds.length+' booked · '+item.plans.length+' arrangements</span><span class="booked-event-chevron">›</span>';
   button.onclick=()=>{expandedBooked=item.id;activeTripTab="accommodation";addingPlanKind=null;editingPlanId=null;renderBooked();window.scrollTo({top:0,behavior:"smooth"})};
   article.append(button);
   const people=document.createElement("div");people.className="booked-overview-people";
   for(const id of item.bookedMemberIds){const member=bookedData.members.find(m=>m.id===id);if(member)people.append(bookedPerson(member));}
   article.append(people);
   list.append(article);
  }
  return;
 }
 const back=document.createElement("button");back.className="trip-back";back.type="button";
 back.textContent="‹  BACK TO BOOKED EVENTS";
 back.onclick=()=>{expandedBooked=null;addingPlanKind=null;editingPlanId=null;renderBooked();window.scrollTo({top:0,behavior:"smooth"})};
 list.append(back);
 const hero=document.createElement("section");hero.className="trip-page-hero";
 hero.innerHTML='<p class="booked-event-date">'+esc(humanDate(event.date))+'</p><h1>'+esc(event.track)+'</h1><p class="trip-hero-sub">'+esc(event.provider||"Track day")+' · '+esc(event.format||"Track day")+'</p><p class="trip-hero-count">✓ '+event.bookedMemberIds.length+' crew member'+(event.bookedMemberIds.length===1?"":"s")+' booked</p>';
 const bottom=document.createElement("div");bottom.className="trip-hero-bottom";
 const people=document.createElement("div");people.className="booked-participants";
 for(const id of event.bookedMemberIds){const member=bookedData.members.find(m=>m.id===id);if(member)people.append(bookedPerson(member));}
 bottom.append(people);
 const website=safeExternalLink(event.sourceUrl||organiserLink(event).url);
 if(website){const a=document.createElement("a");a.href=website;a.target="_blank";a.rel="noopener noreferrer";a.className="booked-organiser";a.textContent="Organiser listing ↗";bottom.append(a);}
 hero.append(bottom);
 const mine=event.bookedMemberIds.includes(bookedData.meId);
 const bookButton=document.createElement("button");bookButton.type="button";bookButton.className="trip-book-toggle"+(mine?" is-booked":"");
 bookButton.textContent=mine?"✓ You're booked · Remove my booking":"+ I'm Booked too";
 bookButton.onclick=async()=>{
  if(mine&&!confirm("Remove your booking for "+event.track+"? Other members will stay booked."))return;
  bookButton.disabled=true;
  try{
   const month=event.date.slice(0,7);
   const data=await crewRequest("book",{month,eventId:event.id,booked:!mine});
   if(chosen===month){crewData=data;crewMonth=month;renderResults();}
   await Promise.all([refreshBooked(),fetchCrewSummary(year)]);
  }catch(error){status.textContent="Could not update booking: "+error.message;bookButton.disabled=false}
 };
 hero.append(bookButton);list.append(hero);
 const heading=document.createElement("p");heading.className="eyebrow trip-planner-label";heading.textContent="TRIP PLANNER";list.append(heading);
 const nav=document.createElement("nav");nav.className="trip-tabs";nav.setAttribute("aria-label","Trip planning sections");
 const tabItems=[["accommodation","⌂","Accommodation"],["trailers","▤","Trailers"],["travel","➤","Travel"]];
 for(const [id,icon,label] of tabItems){
  const tab=document.createElement("button");tab.type="button";tab.className="trip-tab"+(activeTripTab===id?" active":"");
  tab.setAttribute("aria-pressed",String(activeTripTab===id));
  tab.innerHTML='<span class="trip-tab-icon" aria-hidden="true">'+icon+'</span><span>'+label+'</span>';
  tab.onclick=()=>{activeTripTab=id;addingPlanKind=null;editingPlanId=null;renderBooked()};
  nav.append(tab);
 }
 list.append(nav);
 const body=document.createElement("div");body.className="trip-tab-body";
 body.append(activeTripTab==="accommodation"?renderAccommodation(event):renderPlanSection(event,activeTripTab));
 list.append(body);
}
$$("[data-tab]").forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
$("#prevYear").onclick=()=>{year=Math.max(2026,year-1);chosen=null;$("#monthPanel").hidden=true;$("#seasonView").hidden=false;renderMonths();fetchCrewSummary(year)};
$("#nextYear").onclick=()=>{year=Math.min(2032,year+1);chosen=null;$("#monthPanel").hidden=true;$("#seasonView").hidden=false;renderMonths();fetchCrewSummary(year)};
$("#closeMonth").onclick=()=>{chosen=null;$("#monthPanel").hidden=true;$("#seasonView").hidden=false;renderMonths();fetchCrewSummary(year);window.scrollTo({top:0,behavior:"smooth"})};
$("#previousMonth").onclick=()=>{if(!$("#previousMonth").disabled)openMonth(adjacentMonth(chosen,-1))};
$("#followingMonth").onclick=()=>{if(!$("#followingMonth").disabled)openMonth(adjacentMonth(chosen,1))};
$("#selectAllDates").onclick=()=>{
  if(!chosen)return;
  const s=monthState(chosen);
  const [y,m]=chosen.split("-").map(Number);
  const count=new Date(y,m,0).getDate();
  s.dates=s.dates.length===count?[]:Array.from({length:count},(_,i)=>chosen+"-"+String(i+1).padStart(2,"0"));
  save();renderDates();renderResults();renderMonths();queueDateSync(chosen);
};
$("#search").onclick=search;
$("#crewMenuButton").onclick=()=>{
 const menu=$("#crewMenu");menu.hidden=!menu.hidden;
 $("#crewMenuButton").setAttribute("aria-expanded",String(!menu.hidden));
 if(!menu.hidden)renderHeaderCrew();
};
$("#crewEditButton").onclick=openProfileDialog;
$("#crewInviteButton").onclick=copyCrewInvite;
$("#crewDialogClose").onclick=()=>$("#crewDialog").close();
$("#crewSaveButton").onclick=saveCrewProfile;
$("#crewDialog").querySelectorAll("[data-avatar-type]").forEach(button=>{
 button.onclick=()=>{avatarType=button.dataset.avatarType;fillAvatars()};
});
document.addEventListener("pointerdown",event=>{
 const menu=$("#crewMenu"),button=$("#crewMenuButton");
 if(!menu.hidden&&!menu.contains(event.target)&&!button.contains(event.target)){
  menu.hidden=true;button.setAttribute("aria-expanded","false");
 }
});
renderMonths();
initialiseCrew();
