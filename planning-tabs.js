(() => {
  const KEY='tdh-planning-unlocked-v2';
  const level=()=>Number(localStorage.getItem(KEY)||1);
  const unlock=n=>{if(n>level())localStorage.setItem(KEY,String(n));};
  function sync(){
    const root=document.querySelector('#planningV2'); if(!root)return;
    const steps=[...root.querySelectorAll('.steps span')]; if(steps.length!==3)return;
    if(steps[1].classList.contains('on')||steps[1].classList.contains('done'))unlock(2);
    if(steps[2].classList.contains('on'))unlock(3);
    steps.forEach((s,i)=>{
      const n=i+1,open=n<=level();
      s.style.cursor=open?'pointer':'default'; s.style.opacity=open?'1':'.45';
      s.style.pointerEvents=open?'auto':'none'; s.setAttribute('role','button');
      s.setAttribute('aria-disabled',open?'false':'true');
      s.onclick=open?()=>go(n):null;
    });
  }
  function go(n){
    const root=document.querySelector('#planningV2'); if(!root||n>level())return;
    const steps=[...root.querySelectorAll('.steps span')];
    const current=steps.findIndex(x=>x.classList.contains('on'))+1;
    if(current===n)return;
    if(n===1){
      if(current===3){root.querySelector('#pvChoices')?.click();setTimeout(()=>root.querySelector('#pvBack')?.click(),50)}
      else root.querySelector('#pvBack')?.click();
    } else if(n===2){
      if(current===1)root.querySelector('#pvDates')?.click();
      else root.querySelector('#pvChoices')?.click();
    } else if(n===3){
      if(current===2)root.querySelector('#pvDecide')?.click();
    }
  }
  new MutationObserver(sync).observe(document.documentElement,{subtree:true,childList:true});
  setInterval(sync,1000); setTimeout(sync,1200);
})();