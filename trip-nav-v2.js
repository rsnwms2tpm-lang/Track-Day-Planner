(() => {
  const style=document.createElement('style');
  style.textContent=`
    .trip-home-control-wrap{display:flex;justify-content:center;padding:2px 0 16px}
    .trip-home-control{border:0;background:transparent;color:#f4f7f5;font-size:14px;font-weight:950;letter-spacing:.16em;padding:10px 22px;opacity:.96}
    .trip-home-control.active{color:#72df9e}
    .trip-event-mini{display:none;align-items:center;justify-content:space-between;gap:14px;margin:0 0 12px;padding:15px 17px;border:1px solid #29323a;border-radius:18px;background:linear-gradient(135deg,#171d22,#0e1216)}
    .trip-event-mini-copy{min-width:0}.trip-event-mini .eyebrow{font-size:9px;color:#70db9b}.trip-event-mini h2{margin:4px 0 3px;font-size:22px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.trip-event-mini p{margin:0;color:#929da8;font-size:12px}
    .trip-event-mini-count{text-align:right;flex:none}.trip-event-mini-count strong{display:block;font-size:17px}.trip-event-mini-count span{display:block;margin-top:3px;font-size:8px;letter-spacing:.14em;color:#78838f}
    .trip-tabs{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px!important;overflow:visible!important;padding:0 0 15px!important;margin:0!important}
    .trip-tab{width:100%;padding:10px 4px!important;text-align:center}
    .trip-placeholder{margin-top:6px;text-align:center;padding:34px 20px}.trip-placeholder h2{margin:6px 0 8px}.trip-placeholder p{margin:0;color:#929da8}
    .trip-mode-shell.trip-subpage .trip-event-mini{display:flex}
    .trip-mode-shell.trip-subpage .trip-home-control{color:#aab4be}
    .trip-mode-shell.trip-homepage .trip-tabs{margin-top:15px!important}
    @media(max-width:620px){.trip-event-mini{padding:13px 14px}.trip-event-mini h2{font-size:19px}.trip-event-mini-count strong{font-size:15px}.trip-tab{font-size:11px!important}}
  `;
  document.head.appendChild(style);

  function enhance(shell){
    if(!shell||shell.dataset.navV2==='1')return;
    const nav=shell.querySelector('.trip-tabs');
    const homePanel=shell.querySelector('[data-trip-panel="home"]');
    const tripPanel=shell.querySelector('[data-trip-panel="my-trip"]');
    const stayPanel=shell.querySelector('[data-trip-panel="stay"]');
    const oldHome=nav?.querySelector('[data-trip-tab="home"]');
    if(!nav||!homePanel||!tripPanel||!stayPanel||!oldHome)return;
    shell.dataset.navV2='1';

    const hero=homePanel.querySelector('.trip-mode-hero');
    const track=hero?.querySelector('h1')?.textContent?.trim()||'Track day';
    const date=hero?.querySelector('.trip-mode-date')?.textContent?.trim()||'';
    const countdown=hero?.querySelector('[data-booking-countdown]');
    const eventDate=countdown?.dataset.bookingCountdown||'';

    const homeWrap=document.createElement('div');
    homeWrap.className='trip-home-control-wrap';
    oldHome.className='trip-home-control';
    oldHome.textContent='HOME';
    homeWrap.appendChild(oldHome);
    nav.parentNode.insertBefore(homeWrap,nav);

    const mini=document.createElement('section');
    mini.className='trip-event-mini';
    mini.innerHTML=`<div class="trip-event-mini-copy"><span class="eyebrow">🏁 CONFIRMED EVENT</span><h2>${track.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</h2><p>${date.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</p></div><div class="trip-event-mini-count"><strong data-booking-countdown="${eventDate}">${countdown?.childNodes?.[0]?.textContent?.trim()||''}</strong><span>TO GO</span></div>`;
    nav.parentNode.insertBefore(mini,nav);

    const tripButton=nav.querySelector('[data-trip-tab="my-trip"]');
    tripButton.textContent='Trip';

    function addTab(id,label,title,copy){
      const btn=document.createElement('button');
      btn.type='button';btn.className='trip-tab';btn.dataset.tripTab=id;btn.textContent=label;
      nav.appendChild(btn);
      const panel=document.createElement('div');
      panel.className='trip-panel';panel.dataset.tripPanel=id;panel.hidden=true;
      panel.innerHTML=`<section class="trip-mode-card trip-placeholder"><span class="eyebrow">${label.toUpperCase()}</span><h2>${title}</h2><p>${copy}</p></section>`;
      shell.appendChild(panel);
      return {btn,panel};
    }
    const trailers=addTab('trailers','Trailers','Trailers','Trailer planning will live here.');
    const bingo=addTab('bingo','Bingo','Track Day Bingo','Bingo will unlock here as we build the track-day side.');

    const allPanels=()=>[...shell.querySelectorAll('[data-trip-panel]')];
    const allTabs=()=>[...nav.querySelectorAll('[data-trip-tab]')];
    function reflect(id){
      const home=id==='home';
      shell.classList.toggle('trip-homepage',home);
      shell.classList.toggle('trip-subpage',!home);
      oldHome.classList.toggle('active',home);
      allTabs().forEach(t=>t.classList.toggle('active',!home&&t.dataset.tripTab===id));
    }
    function showCustom(id){
      allPanels().forEach(p=>p.hidden=p.dataset.tripPanel!==id);
      reflect(id);
      window.scrollTo({top:0,behavior:'smooth'});
    }
    trailers.btn.onclick=()=>showCustom('trailers');
    bingo.btn.onclick=()=>showCustom('bingo');
    oldHome.addEventListener('click',()=>setTimeout(()=>reflect('home'),0));
    tripButton.addEventListener('click',()=>setTimeout(()=>reflect('my-trip'),0));
    nav.querySelector('[data-trip-tab="stay"]').addEventListener('click',()=>setTimeout(()=>reflect('stay'),0));

    const active=allTabs().find(t=>t.classList.contains('active'))?.dataset.tripTab;
    reflect(active||'home');
  }

  const observer=new MutationObserver(()=>document.querySelectorAll('.trip-mode-shell').forEach(enhance));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.querySelectorAll('.trip-mode-shell').forEach(enhance);
})();