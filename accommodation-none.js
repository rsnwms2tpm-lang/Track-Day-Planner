(() => {
  function currentRow(){
    const eventId=state?.confirmedEventId, meId=state?.me?.id;
    return ((state?.tripDetails)||[]).find(r=>r.event_id===eventId&&r.member_id===meId)||null;
  }

  function savedNoneRequired(){
    return currentRow()?.accommodation_none===true;
  }

  if(typeof window.api==='function'&&!window.__accommodationChoiceApiWrapped){
    const originalApi=window.api;
    window.__accommodationChoiceApiWrapped=true;
    window.api=function(action,method,body){
      if(action==='save-trip-details'&&body){
        const form=document.querySelector('[data-my-trip-form]');
        const none=form?.querySelector('input[name="accommodationNone"]');
        body={...body,accommodationNone:!!none?.checked};
      }
      return originalApi(action,method,body);
    };
  }

  function enhance(form){
    if(!form || form.dataset.accommodationNoneReady==='1') return;
    const list=form.querySelector('.my-trip-section .trip-choice-list');
    if(!list) return;
    form.dataset.accommodationNoneReady='1';

    const label=document.createElement('label');
    label.className='trip-check';
    label.innerHTML=`<input type="checkbox" name="accommodationNone" ${savedNoneRequired()?'checked':''}><div><strong>None Required</strong><span>I don’t need accommodation for this trip</span></div>`;
    list.appendChild(label);

    const none=label.querySelector('input');
    const before=form.querySelector('input[name="nightBefore"]');
    const after=form.querySelector('input[name="nightAfter"]');

    const syncFromNights=()=>{
      if((before?.checked||after?.checked) && none) none.checked=false;
    };
    const syncFromNone=()=>{
      if(!none?.checked) return;
      if(before) before.checked=false;
      if(after) after.checked=false;
    };

    before?.addEventListener('change',syncFromNights);
    after?.addEventListener('change',syncFromNights);
    none?.addEventListener('change',syncFromNone);
  }

  function scan(){document.querySelectorAll('[data-my-trip-form]').forEach(enhance)}
  const observer=new MutationObserver(scan);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  scan();
})();