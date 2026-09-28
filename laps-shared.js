(()=>{
  const pad2=n=>String(n).padStart(2,'0');
  function fromSeconds(n){n=Number(n);if(!Number.isFinite(n)||n<=0)return null;const total=Math.round(n*100),min=Math.floor(total/6000),rem=total-min*6000,sec=Math.floor(rem/100),hundredths=rem%100;return {milliseconds:total*10,display:`${min}:${pad2(sec)}.${pad2(hundredths)}`};}
  function parseLapTime(value){let s=String(value??'').trim().replace(/,/g,'.');if(!s)return null;s=s.replace(/\s+/g,':');let min=0,sec=0;if(s.includes(':')){const p=s.split(':').filter(Boolean);if(p.length>2)return null;min=Number(p.length===2?p[0]:0);sec=Number(p.length===2?p[1]:p[0]);}else{const dots=(s.match(/\./g)||[]).length;if(dots>=2){const p=s.split('.');min=Number(p.shift());sec=Number(p.shift()+'.'+p.join(''));}else{const n=Number(s);if(!Number.isFinite(n))return null;if(n>=60){min=Math.floor(n/60);sec=n-min*60}else sec=n;}}if(!Number.isFinite(min)||!Number.isFinite(sec)||min<0||sec<0||sec>=60)return null;return fromSeconds(min*60+sec);}
  function detectDelimiter(line){const counts=[[';',line.split(';').length],['\t',line.split('\t').length],[',',line.split(',').length]];counts.sort((a,b)=>b[1]-a[1]);return counts[0][1]>1?counts[0][0]:',';}
  function csvRows(text){text=String(text||'');const lines=text.split(/\r?\n/).filter(Boolean);if(lines[0]?.includes(';'))return lines.map(line=>{const semi=line.indexOf(';'),head=semi>=0?line.slice(0,semi):line,rest=semi>=0?line.slice(semi+1):'',comma=head.indexOf(',');return comma>=0?[head.slice(0,comma).trim(),head.slice(comma+1).trim(),...rest.split(';').map(x=>x.trim())]:[head.trim(),...rest.split(';').map(x=>x.trim())]});const first=(lines[0]||''),delimiter=detectDelimiter(first),rows=[];let row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted;}else if(!quoted&&c===delimiter){row.push(cell.trim());cell='';}else if(!quoted&&(c==='\n'||c==='\r')){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell.trim());cell='';if(row.some(Boolean))rows.push(row);row=[];}else cell+=c;}row.push(cell.trim());if(row.some(Boolean))rows.push(row);return rows;}
  function parseLapTrophyCSV(text){
    const lines=String(text||'').replace(/^\uFEFF/,'').split(/\r?\n/).filter(l=>l.trim());
    if(lines.length<2)return [];
    const headerLine=lines[0],semi=headerLine.indexOf(';');
    if(semi<0){
      const h=headerLine.toLowerCase();
      if(h.includes('time(sec)')&&h.includes('lat(deg)')&&h.includes('lon(deg)')){const e=new Error('This is LapTrophy raw GPS telemetry. In LapTrophy, export the lap/session summary CSV.');e.code='LAPTROPHY_RAW_TELEMETRY';throw e}
      return [];
    }
    const head0=headerLine.slice(0,semi),comma=head0.indexOf(',');
    const headers=(comma>=0?[head0.slice(0,comma),head0.slice(comma+1)]:[head0]).concat(headerLine.slice(semi+1).split(';')).map(x=>x.trim().toLowerCase());
    const idx=name=>headers.indexOf(name), sessionIdx=idx('session date'), lapIdx=idx('lap index'), timeIdx=idx('time (s)'), s1Idx=idx('sector1 (s)'), s2Idx=idx('sector2 (s)'), s3Idx=idx('sector3 (s)'), avgIdx=idx('avg. speed (mph)'), maxIdx=idx('max. speed (mph)');
    if(timeIdx<0||sessionIdx<0)return [];
    const sessions=new Map(), num=v=>{const n=Number(String(v??'').trim().replace(',','.'));return Number.isFinite(n)?n:null};
    for(const line of lines.slice(1)){
      const firstSemi=line.indexOf(';');if(firstSemi<0)continue;
      const first=line.slice(0,firstSemi),firstComma=first.indexOf(',');
      const cells=(firstComma>=0?[first.slice(0,firstComma),first.slice(firstComma+1)]:[first]).concat(line.slice(firstSemi+1).split(';')).map(x=>x.trim());
      const seconds=num(cells[timeIdx]),parsed=fromSeconds(seconds);if(!parsed||parsed.milliseconds<10000)continue;
      const session=cells[sessionIdx]||'Session',item={time:parsed.display,milliseconds:parsed.milliseconds,raw:seconds,session,lapNumber:cells[lapIdx]||'',sector1:num(cells[s1Idx]),sector2:num(cells[s2Idx]),sector3:num(cells[s3Idx]),avgSpeedMph:num(cells[avgIdx]),maxSpeedMph:num(cells[maxIdx])};
      const g=sessions.get(session);if(!g)sessions.set(session,{session,laps:[item],fastest:item});else{g.laps.push(item);if(item.milliseconds<g.fastest.milliseconds)g.fastest=item}
    }
    return Array.from(sessions.values()).sort((a,b)=>String(a.session).localeCompare(String(b.session))).map((g,i)=>({...g.fastest,session:g.session,sessionNumber:i+1,lapCount:g.laps.length,laps:g.laps}));
  }
  window.TDHLaps={parseLapTime,parseLapTrophyCSV};

  if(/passenger\.html$/i.test(location.pathname)){
    const style=document.createElement('style');style.textContent=`.passenger-trip-hero{position:relative;overflow:hidden;min-height:300px;padding:30px;box-sizing:border-box;border-radius:28px;background:linear-gradient(135deg,#1c2228,#0c0f13);margin:16px 0 20px}.passenger-trip-hero .kicker{font-size:10px;font-weight:900;letter-spacing:.16em;color:#70db9b}.passenger-trip-hero h1{font-size:clamp(45px,10vw,82px);line-height:.9;margin:14px 0 17px;text-transform:uppercase}.passenger-trip-hero .date{color:#cbd3dc}.passenger-trip-hero .countdown{display:inline-flex;flex-direction:column;margin-top:42px;font-size:clamp(34px,8vw,58px);font-weight:950}.passenger-trip-hero .countdown span{font-size:10px;letter-spacing:.2em;color:#78838f}@media(max-width:620px){.passenger-trip-hero{padding:24px 20px}}`;document.head.appendChild(style);
    const originalFetch=window.fetch.bind(window);window.fetch=async(...args)=>{const response=await originalFetch(...args);try{const url=String(args[0]||'');if(url.includes('action=participant')){const data=await response.clone().json(),p=data.participant||{},eventId=String(p.event_id||data.event_id||''),m=eventId.match(/^(.*)-(\d{4}-\d{2}-\d{2})-(.+)$/),date=p.event_date||p.date||data.event_date||(m&&m[2])||'',track=p.track_name||data.track_name||(m?m[3].split('-').filter(Boolean).map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' '):'Track Day'),provider=p.provider||p.event_provider||data.provider||(m?m[1]:'');setTimeout(()=>renderPassengerHero({date,track,provider}),0)}}catch{}return response};
    function countdown(date){if(!date)return 'COUNTDOWN';const diff=new Date(date+'T07:00:00')-new Date();if(diff<=0)return 'TRACK DAY';const mins=Math.floor(diff/60000),days=Math.floor(mins/1440),hours=Math.floor((mins%1440)/60),minutes=mins%60;return days>0?`${days}d ${hours}h ${minutes}m`:`${hours}h ${minutes}m`}
    function renderPassengerHero(e){const home=document.querySelector('[data-panel="home"]');if(!home)return setTimeout(()=>renderPassengerHero(e),50);home.querySelector('.passenger-trip-hero')?.remove();const dateLabel=e.date?new Date(e.date+'T12:00:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}):'';const hero=document.createElement('section');hero.className='passenger-trip-hero';hero.innerHTML=`<span class="kicker">THE NEXT ONE</span><h1>${String(e.track).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</h1><p class="date">${dateLabel}${e.provider?' · '+e.provider:''}</p><div class="countdown">${countdown(e.date)}<span>UNTIL WE’RE ON TRACK</span></div>`;home.insertBefore(hero,home.firstChild);setInterval(()=>{const el=hero.querySelector('.countdown');if(el)el.innerHTML=`${countdown(e.date)}<span>UNTIL WE’RE ON TRACK</span>`},30000)}
  }
})();