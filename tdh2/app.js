"use strict";
const API_ROOT="https://uehmbzwnbariqebbxcst.supabase.co/functions/v1";
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
state.months=state.months||{};state.interests=state.interests||{};state.booked=state.booked||{};state.profile=state.profile||{name:"",car:""};state.eventCache=state.eventCache||{};state.savedInterestedEvents=state.savedInterestedEvents||{};
let year=2027,chosen=null,allEvents=[],lastSearchMonth="",sourceMessages=[];

const CREW_API=API_ROOT+"/tdh2-planner";
const PROVIDER_WEBSITES={"opentrack":"https://opentrack.co.uk/view-dates","javelin":"https://javelintrackdays.co.uk/trackdays/Upcoming-Events","msv trackdays":"https://shop.msv.com/Calendar/Trackday/Car/List","gold track":"https://www.goldtrack.co.uk/","motorsport events":"https://www.motorsport-events.com/collections/all"};
let crewSession=null,crewMe=null,crewMembers=[],crewEvents=[];
try{const saved=JSON.parse(localStorage.getItem("tdh2-crew-session")||"null");const legacy=JSON.parse(localStorage.getItem("tdp-session")||"null");crewSession=saved?.groupId&&saved?.memberToken?saved:legacy?.groupId&&legacy?.memberToken?legacy:null;}catch{}
function organiserLink(e){const url=safeText(e?.sourceUrl||"");return /^https:\/\/[^\s]+$/i.test(url)?{url,exact:true}:{url:PROVIDER_WEBSITES[safeText(e?.provider).toLowerCase()]||"",exact:false};}
async function crewRequest(month,action="state",payload={}){
 if(!crewSession)return null;
 const args={groupId:crewSession.groupId,token:crewSession.memberToken,month};
 const request=action==="state"?{url:CREW_API+"?"+new URLSearchParams(args),options:{}}:{url:CREW_API,options:{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...args,action,...payload})}};
 const r=await fetch(request.url,{cache:"no-store",...request.options}),data=await r.json();
 if(!r.ok)throw Error(data.error||"Crew planner unavailable");
 return data;
}
function receiveCrewData(data){if(!data)return;crewMe=data.me;crewMembers=data.members||[];crewEvents=data.events||[];renderMonths();renderResults();}
async function loadCrewMonth(month){if(!crewSession)return;try{const data=await crewRequest(month);if(chosen===month)receiveCrewData(data)}catch(e){console.warn("Crew sync failed",e);const el=$("#crewStatus");if(el)el.textContent="Shared crew sync unavailable: "+e.message;}}
function crewInterestRecords(month){return crewSession?crewEvents.filter(e=>e.date?.startsWith(month)&&e.interestedMemberIds?.length):[];}
function myInterest(e){const id=e.savedEventId||e.id||eventId(e);if(crewSession&&crewMe){return crewEvents.some(row=>row.id===id&&row.interestedMemberIds?.includes(crewMe.id));}return !!state.interests[id];}
function interestedNames(e){const id=e.savedEventId||e.id||eventId(e);const ids=crewEvents.find(row=>row.id===id)?.interestedMemberIds||[];return crewMembers.filter(m=>ids.includes(m.id)).map(m=>m.name).join(", ");}

const nowISO=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")};
const monthKey=(y,m)=>y+"-"+String(m+1).padStart(2,"0");
function save(){try{localStorage.setItem(storageKey,JSON.stringify(state))}catch(e){console.warn("Could not store planning data",e)}}
function monthState(k){return state.months[k]||(state.months[k]={dates:[],circuits:[]})}
function standardTrack(n){const raw=safeText(n).toLowerCase();const match=ALIASES.find(([,aliases])=>aliases.some(a=>raw.includes(a)));return match?.[0]||raw.replace(/\s+/g," ").trim()}
function canonical(e){const track=standardTrack(e.track);const provider=safeText(e.provider||"Unknown").toLowerCase().trim();const date=safeText(e.date).slice(0,10);const layout=safeText(e.layout||"").trim().toLowerCase();const fmt=safeText(e.format||"").trim().toLowerCase();return [provider,date,track,layout,fmt].join("|")}
function cleanEvents(items){const map=new Map();for(const e of items){if(!/^20\d{2}-\d{2}-\d{2}$/.test(e.date||"")||!e.track)continue;const track=standardTrack(e.track);if(!CIRCUITS.some(c=>c.toLowerCase()===track))continue;const normalized={...e,track:CIRCUITS.find(c=>c.toLowerCase()===track),date:e.date.slice(0,10)};const key=canonical(normalized);const old=map.get(key);if(!old||(old.price==null&&normalized.price!=null))map.set(key,normalized)}return [...map.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.track.localeCompare(b.track)||safeText(a.provider).localeCompare(safeText(b.provider)))}
function eventId(e){return canonical(e)}
function cachedEvents(k){
  const cache=state.eventCache[k];
  return Array.isArray(cache?.events)?cache.events:[];
}
function selectedEvents(k){
  const known=new Map();
  for(const e of crewInterestRecords(k))known.set(e.id,{...e,savedEventId:e.id});
  // First recover the complete records saved by newer versions of the app.
  for(const e of [...cachedEvents(k),...Object.values(state.savedInterestedEvents)]) {
    if(!crewSession&&e?.date?.startsWith(k)&&state.interests[eventId(e)])known.set(eventId(e),e);
  }
  // Older TDH 2.0 versions stored only the event key, not the event data.
  // Reconstruct a minimal card instead of forcing a new live search.
  for(const [id,interested] of Object.entries(state.interests)){
    if(crewSession||!interested||known.has(id))continue;
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
function setTab(tab){$$("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));$$("[data-panel]").forEach(p=>p.hidden=p.dataset.panel!==tab);if(tab==="booked")renderBooked();if(tab==="crew")renderCrew()}
function renderMonths(){ $("#yearHeading").textContent=year+" Planner"; const months=$('#months');months.innerHTML="";for(let i=0;i<12;i++){const key=monthKey(year,i),s=monthState(key),picked=crewSession?crewInterestRecords(key).length:Object.keys(state.interests).filter(id=>id.includes("|"+key+"-")&&state.interests[id]).length;const b=document.createElement("button");b.className="month"+(chosen===key?" selected":"");b.innerHTML='<span class="name">'+new Intl.DateTimeFormat("en-GB",{month:"long"}).format(new Date(year,i,1))+'</span><span class="summary">'+(s.dates.length?'<span class="dot"></span>'+s.dates.length+' dates':'No dates selected')+(picked?' · '+picked+' interests':'')+'</span>';b.onclick=()=>openMonth(key);months.append(b)}}
function openMonth(key){chosen=key;const [y,m]=key.split("-").map(Number);$("#monthPanel").hidden=false;$("#monthHeading").textContent=new Intl.DateTimeFormat("en-GB",{month:"long",year:"numeric"}).format(new Date(y,m-1,1));renderMonths();renderDates();showSavedMonth();renderResults();$("#sourceStatus").innerHTML="";loadCrewMonth(key);$("#monthPanel").scrollIntoView({behavior:"smooth",block:"start"})}
function renderDates(){if(!chosen)return;const [y,m]=chosen.split("-").map(Number),s=monthState(chosen),start=(new Date(y,m-1,1).getDay()+6)%7,last=new Date(y,m,0).getDate();const grid=$("#dateGrid");grid.innerHTML="";for(const wd of ["M","T","W","T","F","S","S"]){const label=document.createElement("div");label.className="weekday";label.textContent=wd;grid.append(label)}for(let i=0;i<start;i++){const blank=document.createElement("span");blank.className="day blank";grid.append(blank)}for(let d=1;d<=last;d++){const date=chosen+"-"+String(d).padStart(2,"0"),b=document.createElement("button");b.textContent=d;b.className="day"+(s.dates.includes(date)?" selected":"")+(date<nowISO()?" past":"");b.type="button";b.setAttribute("aria-pressed",String(s.dates.includes(date)));b.setAttribute("aria-label",date);b.onclick=()=>{s.dates=s.dates.includes(date)?s.dates.filter(x=>x!==date):[...s.dates,date].sort();save();renderDates();renderMonths();renderResults()};grid.append(b)}updateDateAction()}
function updateDateAction(){
  if(!chosen)return;
  const [y,m]=chosen.split("-").map(Number);
  const count=new Date(y,m,0).getDate();
  const btn=$("#selectAllDates");
  const selected=monthState(chosen).dates.filter(d=>d.startsWith(chosen+"-")).length;
  btn.textContent=selected===count?"Clear all dates":"Select all dates";
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
    const id=e.savedEventId||e.id||eventId(e),mine=myInterest(e),box=document.createElement("article");
    box.className="event";
    const date=new Date(e.date+"T12:00:00");
    const price=e.price==null?(e.recovered?"Details saved before update":"Price not listed"):"£"+Number(e.price).toFixed(0);
    const destination=organiserLink(e);const link=destination.url?'<a target="_blank" rel="noopener noreferrer" href="'+esc(destination.url)+'">'+(destination.exact?"Official listing ↗":"Organiser website ↗")+'</a>':"";
    box.innerHTML='<div class="datebox"><strong>'+date.getDate()+'</strong><span>'+new Intl.DateTimeFormat("en-GB",{month:"short"}).format(date).toUpperCase()+'</span></div><div class="content"><h3>'+esc(e.track)+'</h3><p class="meta">'+esc(e.provider||"Organiser unknown")+' · '+esc(price)+' · '+esc(e.availability||"Availability unknown")+'</p><div class="bottom"><span class="tag">'+esc(e.format||"Track day")+'</span>'+link+'<button type="button" class="'+(mine?"on":"")+'" data-interest>'+(mine?"✓ Interested":"I'm interested")+'</button></div></div>';
    box.querySelector("[data-interest]").onclick=async ev=>{
      const button=ev.currentTarget;
      if(crewSession){
        button.disabled=true;
        try{
          const data=await crewRequest(chosen,"interest",{event:{...e,id,sourceUrl:organiserLink(e).url},interested:!mine});
          receiveCrewData(data);
          if(!mine){state.interests[id]=true;state.savedInterestedEvents[id]=e}
          else{delete state.interests[id];delete state.savedInterestedEvents[id]}
          save();
        }catch(error){alert("Could not save crew interest: "+error.message);button.disabled=false}
      }else{
        if(state.interests[id]){delete state.interests[id];delete state.savedInterestedEvents[id]}
        else{state.interests[id]=true;state.savedInterestedEvents[id]=e}
        save();renderResults();renderMonths();
      }
    };
    const names=interestedNames(e);if(crewSession&&names){const who=document.createElement("p");who.className="meta";who.textContent="Interested: "+names;box.querySelector(".content").append(who)}root.append(box);shown.add(id);
  }
  if(saved.length){
    section(crewSession?"Crew interested events":"Your interested events",crewSession?"Shared with the crew. Open the organiser directly from each event.":"Saved in this browser. Open the organiser directly from each event.");
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
function renderCrew(){$("#memberName").value=state.profile.name||"";$("#memberCar").value=state.profile.car||""}
$$("[data-tab]").forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
$("#prevYear").onclick=()=>{year=Math.max(2026,year-1);chosen=null;$("#monthPanel").hidden=true;renderMonths()};
$("#nextYear").onclick=()=>{year=Math.min(2032,year+1);chosen=null;$("#monthPanel").hidden=true;renderMonths()};
$("#closeMonth").onclick=()=>{chosen=null;$("#monthPanel").hidden=true;renderMonths()};
$("#selectAllDates").onclick=()=>{
  if(!chosen)return;
  const s=monthState(chosen);
  const [y,m]=chosen.split("-").map(Number);
  const count=new Date(y,m,0).getDate();
  s.dates=s.dates.length===count?[]:Array.from({length:count},(_,i)=>chosen+"-"+String(i+1).padStart(2,"0"));
  save();renderDates();renderResults();renderMonths();
};
$("#search").onclick=search;
$("#saveProfile").onclick=()=>{const name=$("#memberName").value.trim();if(!name){$("#profileStatus").textContent="Please enter a name.";return}state.profile={name,car:$("#memberCar").value.trim()};save();$("#profileStatus").textContent="Profile saved on this device."};
renderMonths();
