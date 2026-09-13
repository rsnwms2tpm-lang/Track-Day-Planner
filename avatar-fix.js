(() => {
  const names={helmet:['Classic White','Stealth','Red Rocket','Blue Thunder','High Viz','Matte Black','Retro','Orange Fury','Purple Haze','M Power','British Bulldog','Skull','Pink Speed','Camo','Chicken','Rainbow'],driver:['Clean Cut','Bearded','Stubble','Shades','Cap','Balaclava','Glasses','Older Pro','Bald Stubble','Bald Beard','Long Hair','Moustache','Headphones','Bucket Hat','Wild Card','Track Rat']};
  const xs=[33.5,93,153,213,274,333,394,454], ys=[89.6,170.7,271.7,344.9];
  const coords={};
  names.helmet.forEach((n,i)=>coords[n]={row:Math.floor(i/8),col:i%8});
  names.driver.forEach((n,i)=>coords[n]={row:2+Math.floor(i/8),col:i%8});

  const css=document.createElement('style');
  css.textContent=`
    .tdp-avatar-fallback{color:#fff!important;background:#2b313a!important;border-color:#707985!important;text-shadow:0 1px 2px #000;font-size:18px!important}
    .tdp-avatar[data-avatar-fixed="1"]{position:relative!important;overflow:hidden!important;background-image:none!important}
    .tdp-avatar[data-avatar-fixed="1"]>img{position:absolute!important;max-width:none!important;pointer-events:none!important;user-select:none!important}
    .avatar-remove-choice{width:100%;margin-top:10px;border-color:#707985!important}
  `;
  document.head.appendChild(css);

  let sprite='';
  async function loadSprite(){
    try{
      const txt=await fetch('/avatar-picker.js?v=20260913-0105',{cache:'no-store'}).then(r=>r.text());
      const m=txt.match(/const SPRITE='([^']+)'/);
      if(m) sprite=m[1];
    }catch(e){console.warn('Avatar artwork could not be loaded',e)}
    enhanceAll();
  }

  function enhanceAvatar(el){
    if(!sprite || !el || el.classList.contains('tdp-avatar-fallback')) return;
    const name=el.getAttribute('title');
    const a=coords[name];
    if(!a) return;
    const size=Math.round(el.getBoundingClientRect().width || parseFloat(el.style.width) || 48);
    if(!size) return;
    const scale=size/56.5;
    const img=document.createElement('img');
    img.alt='';
    img.src=sprite;
    img.width=Math.round(500*scale);
    img.height=Math.round(457*scale);
    img.style.width=`${500*scale}px`;
    img.style.height=`${457*scale}px`;
    img.style.left=`${size/2-xs[a.col]*scale}px`;
    img.style.top=`${size/2-ys[a.row]*scale}px`;
    el.replaceChildren(img);
    el.dataset.avatarFixed='1';
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
  loadSprite();
})();