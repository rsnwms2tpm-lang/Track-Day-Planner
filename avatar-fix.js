(() => {
  const driverNames=['Clean Cut','Bearded','Stubble','Shades','Cap','Balaclava','Glasses','Older Pro','Bald Stubble','Bald Beard','Long Hair','Moustache','Headphones','Bucket Hat','Wild Card','Track Rat'];
  const helmetNames=['Classic White','Stealth','Red Rocket','Blue Thunder','High Viz','Matte Black','Retro','Orange Fury','Purple Haze','M Power','British Bulldog','Skull','Pink Speed','Camo','Chicken','Rainbow'];
  const available=new Set([
    ...Array.from({length:11},(_,i)=>`driver-${String(i+1).padStart(2,'0')}`),
    ...Array.from({length:8},(_,i)=>`helmet-${String(i+1).padStart(2,'0')}`)
  ]);
  const nameById={};
  driverNames.forEach((name,i)=>nameById[`driver-${String(i+1).padStart(2,'0')}`]=name);
  helmetNames.forEach((name,i)=>nameById[`helmet-${String(i+1).padStart(2,'0')}`]=name);

  const css=document.createElement('style');
  css.id='static-avatar-art';
  css.textContent=[...available].map(id=>{
    const name=nameById[id];
    return `.avatar-option[data-avatar-id="${id}"] .tdp-avatar,.tdp-avatar[title="${name}"]{background-image:url("/assets/avatars/${id}.png?v=20260922-final1")!important;background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important}`;
  }).join('\n')+`
  .avatar-option[data-avatar-id^="driver-"]:nth-of-type(n+12){display:none!important}
  .avatar-option[data-avatar-id^="helmet-"]:nth-of-type(n+9){display:none!important}
  .tdp-avatar-fallback{color:#fff!important;background:#2b313a!important;border-color:#707985!important;text-shadow:0 1px 2px #000;font-size:18px!important}
  .avatar-remove-choice{width:100%;margin-top:10px;border-color:#707985!important}`;
  document.getElementById('static-avatar-art')?.remove();
  document.head.appendChild(css);

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
        if(document.getElementById('tdhMasterHome')) window.TDHMasterHome?.open?.();
      }catch(err){
        alert('Could not remove avatar: '+(err?.message||err));
        btn.disabled=false;
        btn.textContent='Use my initial instead';
      }
    };
    actions.prepend(btn);
  }

  const obs=new MutationObserver(()=>addRemoveButton(document.querySelector('#avatarPicker')));
  obs.observe(document.documentElement,{childList:true,subtree:true});
  addRemoveButton(document.querySelector('#avatarPicker'));

  document.addEventListener('close',e=>{
    if(e.target?.id==='avatarPicker' && document.getElementById('tdhMasterHome')){
      setTimeout(()=>window.TDHMasterHome?.open?.(),0);
    }
  },true);
})();