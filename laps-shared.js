(()=>{
  const pad2=n=>String(n).padStart(2,'0');
  function fromSeconds(n){
    n=Number(n);if(!Number.isFinite(n)||n<=0)return null;
    const total=Math.round(n*100);const min=Math.floor(total/6000);const rem=total-min*6000;const sec=Math.floor(rem/100),hundredths=rem%100;
    return {milliseconds:total*10,display:`${min}:${pad2(sec)}.${pad2(hundredths)}`};
  }
  function parseLapTime(value){
    let s=String(value??'').trim().replace(/,/g,'.');if(!s)return null;s=s.replace(/\s+/g,':');
    let min=0,sec=0;
    if(s.includes(':')){const p=s.split(':').filter(Boolean);if(p.length>2)return null;min=Number(p.length===2?p[0]:0);sec=Number(p.length===2?p[1]:p[0]);}
    else{const dots=(s.match(/\./g)||[]).length;if(dots>=2){const p=s.split('.');min=Number(p.shift());sec=Number(p.shift()+'.'+p.join(''));}else{const n=Number(s);if(!Number.isFinite(n))return null;if(n>=60){min=Math.floor(n/60);sec=n-min*60}else sec=n;}}
    if(!Number.isFinite(min)||!Number.isFinite(sec)||min<0||sec<0||sec>=60)return null;return fromSeconds(min*60+sec);
  }
  function detectDelimiter(line){const counts=[[';',line.split(';').length],['\t',line.split('\t').length],[',',line.split(',').length]];counts.sort((a,b)=>b[1]-a[1]);return counts[0][1]>1?counts[0][0]:',';}
  function csvRows(text){
    text=String(text||'');const first=(text.split(/\r?\n/).find(Boolean)||'');const delimiter=detectDelimiter(first);const rows=[];let row=[],cell='',quoted=false;
    for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted;}else if(!quoted&&c===delimiter){row.push(cell.trim());cell='';}else if(!quoted&&(c==='\n'||c==='\r')){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell.trim());cell='';if(row.some(Boolean))rows.push(row);row=[];}else cell+=c;}
    row.push(cell.trim());if(row.some(Boolean))rows.push(row);return rows;
  }
  function parseLapTrophyCSV(text){
    const rows=csvRows(text);if(rows.length<2)return [];
    const header=rows[0].map(x=>String(x).trim().toLowerCase());
    // LapTrophy exports elapsed lap duration as "time (s)" in seconds. Never fall back to the lap-index/sector columns.
    let idx=header.findIndex(h=>h==='time (s)'||h==='time(s)'||h==='lap time (s)'||h==='lap time');
    if(idx<0)idx=header.findIndex(h=>/^time\s*\(?(?:s|sec|seconds)\)?$/.test(h));
    if(idx<0)return [];
    const secondsColumn=/\((?:s|sec|seconds)\)|\bseconds?\b/.test(header[idx]);const out=[];
    for(let r=1;r<rows.length;r++){
      const raw=rows[r][idx];if(raw==null||String(raw).trim()==='')continue;
      const parsed=secondsColumn?fromSeconds(String(raw).trim().replace(',','.')):parseLapTime(raw);
      // Reject obviously invalid values instead of silently importing an index/sector column.
      if(parsed&&parsed.milliseconds>=10000)out.push({time:parsed.display,milliseconds:parsed.milliseconds,raw,row:r+1});
    }
    return out;
  }
  window.TDHLaps={parseLapTime,parseLapTrophyCSV};
})();