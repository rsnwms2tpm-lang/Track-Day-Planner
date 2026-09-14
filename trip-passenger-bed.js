(() => {
  const style=document.createElement('style');
  style.textContent=`
    .passenger-row{align-items:flex-start;flex-wrap:wrap}
    .passenger-row input[name="passengerName"]{flex:1 1 calc(100% - 50px)}
    .passenger-bed-option{display:none;flex:1 0 100%;align-items:center;gap:9px;padding:10px 12px;border:1px solid #2a323b;border-radius:12px;background:#171c22;color:#cbd3dc;font-size:12px;cursor:pointer;box-sizing:border-box}
    .passenger-bed-option.show{display:flex}
    .passenger-bed-option input{width:18px!important;height:18px;margin:0;accent-color:#61d38f;flex:none!important}
  `;
  document.head.appendChild(style);

  function savedRow(){
    const eventId=state?.confirmedEventId,meId=state?.me?.id;
    return ((state?.tripDetails)||[]).find(r=>r.event_id===eventId&&r.member_id===meId)||null;
  }

  function enhanceRow(row,index,savedNames,flags){
    if(!row||row.dataset.passengerBedReady==='1')return;
    const name=row.querySelector('input[name="passengerName"]');
    if(!name)return;
    row.dataset.passengerBedReady='1';
    const originalName=String(savedNames[index]||'').trim();
    const label=document.createElement('label');
    label.className='passenger-bed-option';
    label.innerHTML=`<input type="checkbox" name="passengerBedNeeded" ${originalName&&flags[index]?'checked':''}><span>Extra Bed Needed For This Passenger</span>`;
    row.appendChild(label);
    const bed=label.querySelector('input');
    let lastName=name.value.trim();
    const refresh=()=>{
      const current=name.value.trim();
      label.classList.toggle('show',!!current);
      if(!current){
        bed.checked=false;
      }else if(current!==lastName&&current!==originalName){
        bed.checked=false;
      }
      lastName=current;
    };
    name.addEventListener('input',refresh);
    refresh();
  }

  function enhanceForm(form){
    if(!form)return;
    const saved=savedRow();
    const savedNames=Array.isArray(saved?.passenger_names)?saved.passenger_names:[];
    const flags=Array.isArray(saved?.passenger_bed_flags)?saved.passenger_bed_flags:[];
    const scan=()=>[...form.querySelectorAll('.passenger-row')].forEach((row,index)=>enhanceRow(row,index,savedNames,flags));
    scan();
    const list=form.querySelector('[data-passenger-list]');
    if(list&&!list.dataset.passengerBedObserver){
      list.dataset.passengerBedObserver='1';
      new MutationObserver(scan).observe(list,{childList:true});
    }
  }

  const originalApi=api;
  api=async function(action,method='GET',body=null){
    if(action==='save-trip-details'&&method==='POST'&&body&&typeof body==='object'){
      const form=document.querySelector('[data-my-trip-form]');
      if(form){
        const rows=[...form.querySelectorAll('.passenger-row')];
        body.passengerBedFlags=rows
          .filter(row=>!!row.querySelector('input[name="passengerName"]')?.value.trim())
          .map(row=>!!row.querySelector('input[name="passengerBedNeeded"]')?.checked);
      }
    }
    return originalApi(action,method,body);
  };

  const scan=()=>document.querySelectorAll('[data-my-trip-form]').forEach(enhanceForm);
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
  scan();
})();