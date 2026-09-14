(() => {
  const style=document.createElement('style');
  style.textContent=`
    .stay-confirmed-summary{margin-top:14px;padding:13px 14px;border:1px solid #2d3932;border-radius:14px;background:#101712}
    .stay-confirmed-summary strong{display:block;font-size:15px;margin-bottom:4px}
    .stay-confirmed-summary span{display:block;color:#99a59d;font-size:11px;line-height:1.45;white-space:pre-wrap}
    .stay-confirmed-actions{display:flex;gap:8px;margin-top:11px;flex-wrap:wrap}
    .stay-confirmed-actions button{min-height:38px;font-size:11px}
    .stay-extras-card.stay-collapsed>.stay-extras-copy,
    .stay-extras-card.stay-collapsed>[data-airbnb-import],
    .stay-extras-card.stay-collapsed>[data-airbnb-status],
    .stay-extras-card.stay-collapsed>[data-airbnb-form]{display:none!important}
  `;
  document.head.appendChild(style);

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function hasSavedStay(){
    const a=state?.accommodation||{};
    return !!(a.location||a.address||a.stay_details);
  }

  function summaryHtml(){
    const a=state?.accommodation||{};
    const title=a.location||'Accommodation confirmed';
    const lines=[a.address,a.stay_details].filter(Boolean).join('\n');
    return `<div class="stay-confirmed-summary" data-stay-confirmed-summary>
      <strong>${esc(title)} ✓</strong>
      ${lines?`<span>${esc(lines)}</span>`:''}
      <div class="stay-confirmed-actions"><button type="button" class="ghost" data-edit-stay-details>Edit stay details</button></div>
    </div>`;
  }

  function apply(card){
    if(!card||card.dataset.stayCollapseWired==='1')return;
    if(!hasSavedStay())return;
    card.dataset.stayCollapseWired='1';
    card.classList.add('stay-collapsed');
    const head=card.querySelector('.stay-extras-head');
    if(head&&!card.querySelector('[data-stay-confirmed-summary]'))head.insertAdjacentHTML('afterend',summaryHtml());
    const edit=card.querySelector('[data-edit-stay-details]');
    if(edit)edit.onclick=()=>{
      card.classList.remove('stay-collapsed');
      const form=card.querySelector('[data-airbnb-form]');
      if(form)form.hidden=false;
      edit.closest('[data-stay-confirmed-summary]')?.remove();
      card.dataset.stayCollapseWired='0';
    };
  }

  function scan(){
    document.querySelectorAll('[data-stay-extras]').forEach(card=>{
      if(hasSavedStay())apply(card);
    });
  }

  setInterval(scan,700);
  scan();
})();