(()=>{
  const pad2=n=>String(n).padStart(2,'0');
  function parseLapTime(value){
    let s=String(value??'').trim().replace(/,/g,'.');
    if(!s)return null;
    s=s.replace(/\s+/g,':');
    let min=0,sec=0;
    if(s.includes(':')){
      const p=s.split(':').filter(Boolean);
      if(p.length>2)return null;
      min=Number(p.length===2?p[0]:0);
      sec=Number(p.length===2?p[1]:p[0]);
    }else{
      const dots=(s.match(/\./g)||[]).length;
      if(dots>=2){
        const p=s.split('.');
        min=Number(p.shift());
        sec=Number(p.shift()+'.'+p.join(''));
      }else{
        const n=Number(s);
        if(!Number.isFinite(n))return null;
        if(n>=60){min=Math.floor(n/60);sec=n-min*60}else sec=n;
      }
    }
    if(!Number.isFinite(min)||!Number.isFinite(sec)||min<0||sec<0||sec>=60)return null;
    let total=Math.round((min*60+sec)*100);
    min=Math.floor(total/6000); total-=min*6000;
    sec=Math.floor(total/100); const hundredths=total%100;
    return {milliseconds:(min*60+sec)*1000+hundredths*10,display:`${min}:${pad2(sec)}.${pad2(hundredths)}`};
  }
  function csvRows(text){
    const rows=[];let row=[],cell='',quoted=false;
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(c==='"'){
        if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted;
      }else if(!quoted&&(c===','||c===';'||c==='\t')){row.push(cell.trim());cell=''}
      else if(!quoted&&(c==='\n'||c==='\r')){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell.trim());cell='';if(row.some(Boolean))rows.push(row);row=[]}
      else cell+=c;
    }
    row.push(cell.trim());if(row.some(Boolean))rows.push(row);return rows;
  }
  function parseLapTrophyCSV(text){
    const rows=csvRows(String(text||''));if(!rows.length)return [];
    const header=rows[0].map(x=>x.toLowerCase());
    let idx=header.findIndex(h=>/(lap.*time|time.*lap|duration|lap time)/.test(h));
    const start=idx>=0?1:0;
    const out=[];
    for(let r=start;r<rows.length;r++){
      const cells=rows[r];
      const candidates=idx>=0?[cells[idx]]:cells;
      let parsed=null,raw='';
      for(const c of candidates){const p=parseLapTime(c);if(p){parsed=p;raw=c;break}}
      if(parsed)out.push({time:parsed.display,milliseconds:parsed.milliseconds,raw,row:r+1});
    }
    return out;
  }
  window.TDHLaps={parseLapTime,parseLapTrophyCSV};
})();