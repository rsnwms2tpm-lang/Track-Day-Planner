(() => {
  const BASE='https://uehmbzwnbariqebbxcst.supabase.co/functions/v1/avatar-art?id=';
  const names={helmet:['Classic White','Stealth','Red Rocket','Blue Thunder','High Viz','Matte Black','Retro','Orange Fury','Purple Haze','M Power','British Bulldog','Skull','Pink Speed','Camo','Chicken','Rainbow'],driver:['Clean Cut','Bearded','Stubble','Shades','Cap','Balaclava','Glasses','Older Pro','Bald Stubble','Bald Beard','Long Hair','Moustache','Headphones','Bucket Hat','Wild Card','Track Rat']};
  const ids={};
  names.helmet.forEach((n,i)=>ids[n]=`helmet-${String(i+1).padStart(2,'0')}`);
  names.driver.forEach((n,i)=>ids[n]=`driver-${String(i+1).padStart(2,'0')}`);

  const css=document.createElement('style');
  css.textContent=`
    .tdp-avatar-fallback{color:#fff!important;background:#2b313a!important;border-color:#707985!important;text-shadow:0 1px 2px #000;font-size:18px!important}
    .tdp-avatar[data-avatar-fixed="1"]{position:relative!important;overflow:hidden!important;background-image:none!important}
    .tdp-avatar[data-avatar-fixed="1"]>img{width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;pointer-events:none!important;user-select:none!important}
    .avatar-remove-choice{width:100%;margin-top:10px;border-color:#707985!important}
  `;
  document.head.appendChild(css);

  function enhanceAvatar(el){
    if(!el || el.classList.contains('tdp-avatar-fallback') || el.dataset.avatarFixed==='1') return;
    const name=el.getAttribute('title');
    const id=ids[name];
    if(!id) return;
    const size=Math.round(parseFloat(el.style.width) || el.getBoundingClientRect().width || 48);
    if(!size) return;
    const img=document.createElement('img');
    img.alt=name||'';
    img.src=BASE+encodeURIComponent(id)+'&v=2';
    img.decoding='async';
    el.style.position='relative';
    el.style.overflow='hidden';
    el.style.width=`${size}px`;
    el.style.height=`${size}px`;
    el.style.minWidth=`${size}px`;
    el.style.minHeight=`${size}px`;
    el.style.maxWidth=`${size}px`;
    el.style.maxHeight=`${size}px`;
    el.style.backgroundImage='none';
    el.dataset.avatarFixed='1';
    el.replaceChildren(img);
    img.onerror=()=>{
      console.warn('Avatar artwork failed to load',id);
      el.dataset.avatarFixed='';
      el.replaceChildren();
    };
  }

  function addRemoveButton(dialog){
    if(!dialog || dialog.querySelector('.avatar-remove-choice')) return;
    const selected=dialog.querySelector('.avatar-option.selected');
    if(!selected) return;
    const actions=dialog.querySelector('.avatar-actions');
    if(!actions) return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='avatar-remove-choice';
    btn.textContent='Use my initial instead';
    btn.onclick=async()=>{
      btn.disabled=true;
      btn.textContent='Removing…';
      try{
        await api('update-profile','POST',{groupId:session.groupId,token:session.memberToken,avatar:''});
        state=await api('group','GET',{groupId:session.groupId,token:session.memberToken});
        dialog.close();
        render();
      }catch(err){
        alert('Could not remove avatar: '+(err?.message||err));
        btn.disabled=false;
        btn.textContent='Use my initial instead';
      }
    };
    actions.prepend(btn);
  }

  function enhanceAll(){
    document.querySelectorAll('.tdp-avatar:not(.tdp-avatar-fallback)').forEach(enhanceAvatar);
    addRemoveButton(document.querySelector('#avatarPicker'));
  }

  const obs=new MutationObserver(()=>requestAnimationFrame(enhanceAll));
  obs.observe(document.documentElement,{childList:true,subtree:true});
  enhanceAll();
})();