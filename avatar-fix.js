(() => {
  const css=document.createElement('style');
  css.id='static-avatar-art';
  css.textContent=`
  .tdp-avatar:not(.tdp-avatar-fallback){background-size:106% 106%!important;background-position:48% 47%!important;background-repeat:no-repeat!important}
  .tdp-avatar-fallback{color:#fff!important;background:#2b313a!important;border-color:#707985!important;text-shadow:0 1px 2px #000;font-size:18px!important}
  .avatar-remove-choice{width:100%;margin-top:10px;border-color:#707985!important}
  `;
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
})();
