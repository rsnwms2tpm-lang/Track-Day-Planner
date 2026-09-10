(()=>{
  const session=JSON.parse(localStorage.getItem('tdp-session')||'null');
  if(!session)return;
  let availability={};
  let busy=false;

  async function refreshAvailability(){
    if(busy)return;
    busy=true;
    try{
      const u=new URL('/api',location.origin);
      u.searchParams.set('action','group');
      u.searchParams.set('groupId',session.groupId);
      u.searchParams.set('token',session.memberToken);
      const r=await fetch(u,{cache:'no-store'});
      if(!r.ok)return;
      const s=await r.json();
      availability={};
      (s.availability||[]).filter(a=>a.member_id===s.me?.id).forEach(a=>availability[String(a.date).slice(0,10)]=a.status);
      decorate();
    }catch(e){console.error('Availability badge refresh failed',e)}finally{busy=false}
  }

  function eventDate(card){
    const vote=card.querySelector('[data-vote]')?.dataset.vote||'';
    const hit=vote.match(/(20\d{2}-\d{2}-\d{2})/);
    if(hit)return hit[1];
    const box=card.querySelector('.datebox');
    if(!box)return '';
    const day=box.querySelector('strong')?.textContent?.trim();
    const rest=box.querySelector('span')?.textContent?.trim();
    if(!day||!rest)return '';
    const d=new Date(`${day} ${rest} 12:00:00`);
    if(Number.isNaN(d.getTime()))return '';
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function decorate(){
    document.querySelectorAll('#voteList .event').forEach(card=>{
      const date=eventDate(card);
      if(!date)return;
      let badge=card.querySelector('.my-availability-badge');
      if(!badge){
        badge=document.createElement('div');
        badge.className='my-availability-badge';
        const main=card.querySelector('h3')?.parentElement;
        if(main){
          const meta=main.querySelector('.meta');
          if(meta)meta.insertAdjacentElement('afterend',badge); else main.appendChild(badge);
        }
      }
      const status=availability[date]||'';
      badge.className=`my-availability-badge ${status||'unmarked'}`;
      badge.textContent=status==='yes'?'✓ YOU MARKED THIS DATE AVAILABLE':status==='maybe'?'? YOU MARKED THIS DATE MAYBE':'— YOU DID NOT MARK THIS DATE AVAILABLE';
    });
  }

  const style=document.createElement('style');
  style.textContent=`
    .my-availability-badge{display:inline-flex;align-items:center;margin-top:10px;padding:7px 10px;border-radius:999px;font-size:11px;font-weight:800;letter-spacing:.04em;border:1px solid rgba(255,255,255,.14)}
    .my-availability-badge.yes{background:rgba(39,190,130,.13);border-color:rgba(39,190,130,.45)}
    .my-availability-badge.maybe{background:rgba(245,181,51,.12);border-color:rgba(245,181,51,.4)}
    .my-availability-badge.unmarked{opacity:.7}
  `;
  document.head.appendChild(style);

  const voteList=document.querySelector('#voteList');
  if(voteList)new MutationObserver(()=>{decorate()}).observe(voteList,{childList:true,subtree:true});
  refreshAvailability();
  document.querySelector('[data-stage="vote"]')?.addEventListener('click',refreshAvailability);
})();
