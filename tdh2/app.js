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
      if(e.interestedMemberIds?.length)known.set(e.id,{...e,savedEventId:e.id});
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
    section(activeCrew()?"Crew interested events":"Your interested events",activeCrew()?"Shared across the crew. Open any organiser link directly.":"Your earlier saved interests appear here. Join the crew to share future selections.");
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
function renderBooked(){const list=$("#bookedList");list.innerHTML='<p class="note">No crew-wide bookings connected yet. The shared booking and logistics system is the next build milestone.</p>'}
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
