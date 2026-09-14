(() => {
  const css=document.createElement('style');
  css.textContent=`
    .passenger-row{align-items:flex-start;flex-wrap:wrap}
    .passenger-row input[name="passengerName"]{flex:1 1 calc(100% - 50px)}
    .passenger-bed-question{display:none;flex:1 0 100%;margin-top:2px;padding:10px 12px;border:1px solid #2a323b;border-radius:12px;background:#151a20;color:#cbd3dc;font-size:12px;align-items:center;gap:9px;box-sizing:border-box}
    .passenger-bed-question.show{display:flex}
    .passenger-bed-question input{width:18px;height:18px;margin:0;accent-color:#61d38f;flex:none}
  `;
  document.head.appendChild(css);

  function currentSavedFlags(){
    const eventId=state?.confirmedEventId;
    const meId=state?.me?.id;
    const row=((state?.tripDetails)||[]).find(r=>r.event_id===eventId&&r.member_id===meId);
    return Array.isArray(row?.passenger_bed_flags)?row.passenger_bed_flags:[];
  }

  function enhanceForm(form){
    if(!form||form.dataset.bedPromptReady==='1')return;
    form.dataset.bedPromptReady='1';
    const flags=currentSavedFlags();

    function enhanceRow(row,index){
      if(!row||row.dataset.bedPromptReady==='1')return;
      row.dataset.bedPromptReady='1';
      const name=row.querySelector('input[name="passengerName"]');
      if(!name)return;
      const label=document.createElement('label');
      label.className='passenger-bed-question';
      label.innerHTML=`<input type="checkbox" name="passengerBedNeeded" ${flags[index]?'checked':''}><span>Extra Bed Needed For This Passenger</span>`;
      row.appendChild(label);
      const refresh=()=>label.classList.toggle('show',!!name.value.trim());
      name.addEventListener('input',refresh);
      refresh();
    }

    function enhanceRows(){[...form.querySelectorAll('.passenger-row')].forEach((row,i)=>enhanceRow(row,i));}
    enhanceRows();
    const list=form.querySelector('[data-passenger-list]');
    if(list)new MutationObserver(enhanceRows).observe(list,{childList:true});
  }

  function refreshStayTotals(shell){
    const summary=shell.querySelector('.stay-summary');
    if(!summary)return;
    const eventId=state?.confirmedEventId;
    const details=((state?.tripDetails)||[]).filter(r=>r.event_id===eventId);
    let before=0,after=0;
    details.forEach(r=>{
      const extra=(Array.isArray(r.passenger_bed_flags)?r.passenger_bed_flags:[]).filter(Boolean).length;
      if(r.night_before)before+=1+extra;
      if(r.night_after)after+=1+extra;
    });
    const stats=[...summary.querySelectorAll('.stay-stat strong')];
    if(stats[2])stats[2].textContent=String(before);
    if(stats[3])stats[3].textContent=String(after);
  }

  document.addEventListener('submit',async ev=>{
    const form=ev.target.closest?.('[data-my-trip-form]');
    if(!form)return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    const submit=form.querySelector('[type="submit"]');
    const rows=[...form.querySelectorAll('.passenger-row')];
    const passengerNames=rows.map(r=>r.querySelector('input[name="passengerName"]')?.value.trim()||'');
    const passengerBedFlags=rows.map(r=>!!r.querySelector('input[name="passengerBedNeeded"]')?.checked);
    const fd=new FormData(form);
    if(submit){submit.disabled=true;submit.textContent='Saving…';}
    try{
      await api('save-trip-details','POST',{
        groupId:session.groupId,
        token:session.memberToken,
        eventId:state.confirmedEventId,
        nightBefore:fd.get('nightBefore')==='on',
        nightAfter:fd.get('nightAfter')==='on',
        trailer:fd.get('trailer')==='on',
        passengerNames,
        passengerBedFlags
      });
      await loadGroup();
    }catch(err){
      alert('Could not save trip details: '+(err?.message||err));
      if(submit){submit.disabled=false;submit.textContent='Save my trip details';}
    }
  },true);

  function enhance(){
    document.querySelectorAll('[data-my-trip-form]').forEach(enhanceForm);
    document.querySelectorAll('.trip-mode-shell').forEach(refreshStayTotals);
  }
  const observer=new MutationObserver(enhance);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  enhance();
})();