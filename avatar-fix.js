(() => {
  const names={
    helmet:['Classic White','Stealth','Red Rocket','Blue Thunder','High Viz','Matte Black','Retro','Orange Fury','Purple Haze','M Power','British Bulldog','Skull','Pink Speed','Camo','Chicken','Rainbow'],
    driver:['Clean Cut','Bearded','Stubble','Shades','Cap','Balaclava','Glasses','Older Pro','Bald Stubble','Bald Beard','Long Hair','Moustache','Headphones','Bucket Hat','Wild Card','Track Rat']
  };
  const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const paths={};
  names.driver.forEach((n,i)=>paths[n]=`/assets/avatars/driver-${String(i+1).padStart(2,'0')}-${slug(n)}.jpg`);
  names.helmet.forEach((n,i)=>paths[n]=`/assets/avatars/helmet-${String(i+1).padStart(2,'0')}-${slug(n)}.jpg`);

  const css=document.createElement('style');
  css.textContent=`
    .tdp-avatar-fallback{color:#fff!important;background:#2b313a!important;border-color:#707985!important;text-shadow:0 1px 2px #000;font-size:18px!important}
    .tdp-avatar[data-avatar-static="1"]{position:relative!important;overflow:hidden!important;background:none!important}
    .tdp-avatar[data-avatar-static="1"]>img{width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;border-radius:50%!important;pointer-events:none!important;user-select:none!important}
    .avatar-remove-choice{width:100%;margin-top:10px;border-color:#707985!important}
  `;
  document.head.appendChild(css);

  function enhanceAvatar(el){
    if(!el || el.classList.contains('tdp-avatar-fallback')) return;
    const name=el.getAttribute('title');
    const src=paths[name];
    if(!src) return;
    const existing=el.querySelector('img');
    if(el.dataset.avatarStatic==='1' && existing?.getAttribute('src')===src) return;
    const size=Math.round(parseFloat(el.style.width)||el.getBoundingClientRect().width||48);
    if(!size) return;
    const img=document.createElement('img');
    img.alt=name||'';
    img.src=src;
    img.decoding='async';
    img.draggable=false;
    el.style.position='relative';
    el.style.overflow='hidden';
    el.style.width=`${size}px`;
    el.style.height=`${size}px`;
    el.style.minWidth=`${size}px`;
    el.style.minHeight=`${size}px`;
    el.style.maxWidth=`${size}px`;
    el.style.maxHeight=`${size}px`;
    el.style.background='none';
    el.dataset.avatarStatic='1';
    el.replaceChildren(img);
    img.onerror=()=>{
      console.warn('Static avatar artwork failed to load',src);
      el.dataset.avatarStatic='';
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
  requestAnimationFrame(enhanceAll);
})();
