(()=>{
  const style=document.createElement('style');
  style.textContent='.stay-confirmed .waze-stay{display:none!important}';
  document.head.appendChild(style);

  document.addEventListener('click',e=>{
    const edit=e.target.closest('[data-edit-stay]');
    if(!edit)return;
    const card=edit.closest('[data-stay-extras]');
    if(!card)return;
    const editor=card.querySelector('[data-stay-editor]');
    const form=card.querySelector('[data-airbnb-form]');
    const summary=card.querySelector('[data-stay-confirmed]');
    if(editor)editor.hidden=false;
    if(form)form.hidden=false;
    if(summary)summary.hidden=true;
    setTimeout(()=>editor?.scrollIntoView({behavior:'smooth',block:'nearest'}),30);
  });
})();
