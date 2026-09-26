(()=>{
 const CACHE_PREFIX='tdh-weather-v1:';
 const HOUR=60*60*1000;
 const DAY=24*HOUR;
 function refreshAge(e){
  if(!e?.date)return DAY;
  const eventStart=new Date(e.date+'T00:00:00');
  const hours=(eventStart.getTime()-Date.now())/HOUR;
  if(hours<=24)return HOUR;
  if(hours<=48)return 3*HOUR;
  if(hours<=7*24)return 12*HOUR;
  return DAY;
 }
 const TRACKS={
  'castle combe':{lat:51.4934,lon:-2.2175,label:'Castle Combe'}
 };
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function place(track){const k=String(track||'').toLowerCase();return Object.entries(TRACKS).find(([n])=>k.includes(n))?.[1]||null}
 function codeInfo(code){
  if(code===0)return ['☀️','Sunny'];
  if(code===1)return ['🌤️','Mostly sunny'];
  if(code===2)return ['⛅','Partly cloudy'];
  if(code===3)return ['☁️','Cloudy'];
  if([45,48].includes(code))return ['🌫️','Fog'];
  if([51,53,55,56,57].includes(code))return ['🌦️','Drizzle'];
  if([61,63,65,66,67,80,81,82].includes(code))return ['🌧️','Rain'];
  if([71,73,75,77,85,86].includes(code))return ['🌨️','Snow'];
  if([95,96,99].includes(code))return ['⛈️','Thunder'];
  return ['🌤️','Mixed'];
 }
 function cacheKey(e){return CACHE_PREFIX+String(e?.id||e?.track||'event')}
 function read(e){try{return JSON.parse(localStorage.getItem(cacheKey(e))||'null')}catch{return null}}
 function write(e,v){try{localStorage.setItem(cacheKey(e),JSON.stringify(v))}catch{}}
 function summarise(j,date){
  const h=j?.hourly;if(!h?.time?.length)return null;
  const rows=h.time.map((t,i)=>({t,hr:Number(t.slice(11,13)),code:h.weather_code?.[i],temp:h.temperature_2m?.[i],rain:h.precipitation_probability?.[i]})).filter(x=>x.t.startsWith(date));
  const session=(name,a,b)=>{const r=rows.filter(x=>x.hr>=a&&x.hr<b);if(!r.length)return null;const wet=r.reduce((x,y)=>(Number(y.rain)||0)>(Number(x.rain)||0)?y:x,r[0]);const representative=r.reduce((x,y)=>Math.abs(y.hr-(a+b)/2)<Math.abs(x.hr-(a+b)/2)?y:x,r[0]);const chosen=(Number(wet.rain)||0)>=40?wet:representative;const [icon,label]=codeInfo(Number(chosen.code));const temps=r.map(x=>Number(x.temp)).filter(Number.isFinite);return {name,icon,label,temp:temps.length?Math.round(temps.reduce((x,y)=>x+y,0)/temps.length):null,rain:Math.max(...r.map(x=>Number(x.rain)||0))}};
  return {updatedAt:Date.now(),date,morning:session('MORNING',8,12),afternoon:session('AFTERNOON',12,17)};
 }
 async function fetchForecast(e){
  const p=place(e?.track);if(!p||!e?.date)return null;
  const url='https://api.open-meteo.com/v1/forecast?latitude='+p.lat+'&longitude='+p.lon+'&hourly=temperature_2m,precipitation_probability,weather_code&timezone=Europe%2FLondon&forecast_days=16';
  const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('Weather unavailable');const v=summarise(await r.json(),e.date);if(v)write(e,v);return v
 }
 function eventFromState(){let id=null;try{id=state?.confirmedEventId||null}catch{}if(!id){try{id=JSON.parse(localStorage.getItem('tdp-state')||'null')?.confirmedEventId||null}catch{}}if(!id)return null;let live=null;try{live=Array.isArray(events)?events.find(x=>x.id===id):null}catch{}if(live)return live;const m=String(id).match(/^(.*)-(\d{4}-\d{2}-\d{2})-(.+)$/);return m?{id,provider:m[1],date:m[2],track:m[3].split('-').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ')}:null}
 function html(v){
  const card=x=>x?'<div class="tdh-weather-session"><span class="tdh-weather-icon">'+x.icon+'</span><div><small>'+x.name+'</small><strong>'+esc(x.label)+(Number.isFinite(x.temp)?' · '+x.temp+'°C':'')+'</strong><span>'+x.rain+'% rain</span></div></div>':'';
  return '<div class="tdh-weather"><div class="tdh-weather-title">TRACK DAY WEATHER <span>FORECAST</span></div><div class="tdh-weather-grid">'+card(v.morning)+card(v.afternoon)+'</div></div>'
 }
 function paint(e,v){if(!v)return;document.querySelectorAll('.trip-mode-hero').forEach(hero=>{const existing=hero.querySelector('.tdh-weather');if(existing){existing.outerHTML=html(v);return}const cd=hero.querySelector('.trip-mode-countdown');if(!cd)return;cd.insertAdjacentHTML('afterend',html(v))})}
 async function refresh(){
  const e=eventFromState();if(!e)return;const cached=read(e);if(cached)paint(e,cached);
  if(cached&&Date.now()-cached.updatedAt<refreshAge(e))return;
  try{const v=await fetchForecast(e);if(v)paint(e,v)}catch(err){console.warn('Track Day weather unavailable',err)}
 }
 const css=document.createElement('style');css.textContent='.trip-mode-hero h1{font-size:clamp(42px,12vw,72px)!important;line-height:.92!important;white-space:nowrap!important;letter-spacing:-.045em!important;margin-bottom:14px!important}.trip-mode-hero .trip-mode-date{margin-bottom:14px!important}.trip-mode-hero .trip-mode-countdown{margin-top:10px!important;padding-top:0!important}.tdh-weather{margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.12)}.tdh-weather-title{font-size:10px;font-weight:950;letter-spacing:.16em;color:#72df9e}.tdh-weather-title span{color:#7f8995;margin-left:5px}.tdh-weather-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:7px}.tdh-weather-session{display:flex;align-items:center;gap:9px;padding:7px 9px;border:1px solid #303941;border-radius:14px;background:rgba(8,12,14,.55)}.tdh-weather-icon{font-size:22px}.tdh-weather-session div{min-width:0}.tdh-weather-session small,.tdh-weather-session strong,.tdh-weather-session div>span{display:block}.tdh-weather-session small{font-size:8px;font-weight:950;letter-spacing:.13em;color:#8f9aa5}.tdh-weather-session strong{font-size:12px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tdh-weather-session div>span{font-size:9px;color:#89949d;margin-top:2px}@media(max-width:390px){.tdh-weather{margin-top:10px;padding-top:10px}.tdh-weather-grid{gap:7px}}';document.head.appendChild(css);
 const observer=new MutationObserver(()=>{if(document.querySelector('.trip-mode-hero:not(:has(.tdh-weather))'))refresh()});observer.observe(document.documentElement,{childList:true,subtree:true});
 window.addEventListener('focus',refresh);window.addEventListener('tdh:session-ready',()=>setTimeout(refresh,400));setTimeout(refresh,1300);
 window.TDHWeather={refresh};
})();