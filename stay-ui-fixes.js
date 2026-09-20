(()=>{
  const style=document.createElement('style');
  style.textContent='[data-stay-extras].tdh-editing-stay [data-airbnb-form] input{pointer-events:auto!important;user-select:text!important;-webkit-user-select:text!important;opacity:1!important}[data-stay-extras].tdh-editing-stay [data-airbnb-form]{pointer-events:auto!important}.stay-confirmed .waze-stay{display:none!important}[data-stay-extras].tdh-editing-stay [data-stay-confirmed]{display:none!important}[data-stay-extras].tdh-editing-stay [data-stay-editor],[data-stay-extras].tdh-editing-stay [data-airbnb-form]{display:grid!important}[data-stay-extras].tdh-editing-stay [data-stay-editor]{display:block!important}';
  document.head.appendChild(style);

  let editing=false;
  function applyEditState(){
    if(!editing)return;
    const card=document.querySelector('[data-stay-extras]');
    if(!card)return;
    card.classList.add('tdh-editing-stay');
    const editor=card.querySelector('[data-stay-editor]');
    const form=card.querySelector('[data-airbnb-form]');
    const summary=card.querySelector('[data-stay-confirmed]');
    if(editor){editor.hidden=false;editor.removeAttribute('hidden')}
    if(form){form.hidden=false;form.removeAttribute('hidden');form.style.pointerEvents='auto';form.querySelectorAll('input,textarea,select').forEach(el=>{el.disabled=false;el.readOnly=false;el.removeAttribute('readonly');el.removeAttribute('disabled');el.style.pointerEvents='auto';el.style.touchAction='manipulation';el.tabIndex=0})}
    if(summary){summary.hidden=true;summary.setAttribute('hidden','')}
  }

  document.addEventListener('pointerdown',e=>{const input=e.target.closest?.('[data-stay-extras].tdh-editing-stay [data-airbnb-form] input');if(!input)return;e.stopPropagation()},true);
  document.addEventListener('touchstart',e=>{const input=e.target.closest?.('[data-stay-extras].tdh-editing-stay [data-airbnb-form] input');if(!input)return;e.stopPropagation()},{capture:true,passive:true});
  document.addEventListener('click',e=>{const input=e.target.closest?.('[data-stay-extras].tdh-editing-stay [data-airbnb-form] input');if(!input)return;e.stopPropagation();try{input.focus({preventScroll:true})}catch{input.focus()}},true);

  document.addEventListener('click',e=>{
    const edit=e.target.closest('[data-edit-stay]');
    if(edit){
      e.preventDefault();e.stopPropagation();
      editing=true;
      applyEditState();
      setTimeout(()=>document.querySelector('[data-stay-extras] [data-stay-editor]')?.scrollIntoView({behavior:'smooth',block:'nearest'}),40);
      return;
    }
    if(e.target.closest('[data-airbnb-cancel]')){
      editing=false;
      document.querySelector('[data-stay-extras]')?.classList.remove('tdh-editing-stay');
    }
    if(e.target.closest('[data-airbnb-form] [type="submit"]'))editing=false;
  },true);

  const observer=new MutationObserver(()=>applyEditState());
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
