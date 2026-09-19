(()=>{
const css=document.createElement('style');css.textContent=`
.tdh-global-menu{position:fixed;top:max(12px,env(safe-area-inset-top));right:12px;z-index:100200}
.tdh-global-menu>button{border:1px solid #365044;border-radius:999px;background:#0b100d;color:#eaf3ed;padding:9px 12px;font:800 11px system-ui,-apple-system,sans-serif;letter-spacing:.08em;box-shadow:0 6px 24px rgba(0,0,0,.3)}
.tdh-global-sheet{position:fixed;inset:0;z-index:100210;background:rgba(0,0,0,.72);backdrop-filter:blur(6px);display:flex;align-items:flex-start;justify-content:flex-end;padding:max(58px,calc(env(safe-area-inset-top) + 52px)) 12px 12px}
.tdh-global-card{width:min(330px,calc(100vw - 24px));background:#0e1418;border:1px solid #304139;border-radius:20px;padding:14px;box-shadow:0 18px 50px rgba(0,0,0,.45)}
.tdh-global-card small{display:block;color:#55f08c;font:900 10px system-ui;letter-spacing:.16em;margin:2px 4px 10px}
.tdh-global-card button{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid #263139;background:transparent;color:#eef5f0;padding:15px 12px;font:900 15px system-ui}
.tdh-global-card button:last-child{border-bottom:0}.tdh-global-card button span{float:right;color:#68757d}
`;document.head.appendChild(css);
let sheet=null;
const planning=()=>document.querySelector('#planningV2');
const tripShell=()=>document.querySelector('.trip-mode-shell');
function hidePlanning(){const p=planning();if(p)p.style.setProperty('display','none','important')}
function suspendTrack(){window.TDHTrackDayMode?.suspend?.()}
function showTrip(tab){
  suspendTrack();hidePlanning();
  const s=tripShell();if(!s)return;
  s.style.removeProperty('display');document.body.classList.add('trip-mode');
  if(tab){window.__tdhSetBaseTripTab?.(tab);s.querySelector(`[data-trip-tab="${tab}"]`)?.click()}
}
function showPlanning(){
  suspendTrack();document.body.classList.remove('trip-mode');
  const s=tripShell();if(s)s.style.setProperty('display','none','important');
  const p=planning();if(p)p.style.removeProperty('display');
}
async function showTrack(){
  hidePlanning();const s=tripShell();if(s)s.style.removeProperty('display');document.body.classList.add('trip-mode');
  await window.TDHTrackDayMode?.open?.();
}
function close(){sheet?.remove();sheet=null}
function open(){
  close();sheet=document.createElement('div');sheet.className='tdh-global-sheet';
  sheet.innerHTML=`<div class="tdh-global-card"><small>NAVIGATE</small><button data-go="home">HOME <span>›</span></button><button data-go="planning">PLANNING <span>›</span></button><button data-go="trip">TRIP <span>›</span></button><button data-go="track">TRACK DAY <span>›</span></button></div>`;
  document.body.appendChild(sheet);sheet.onclick=e=>{if(e.target===sheet)close()};
  sheet.querySelector('[data-go="home"]').onclick=()=>{close();showTrip('home')};
  sheet.querySelector('[data-go="planning"]').onclick=()=>{close();showPlanning()};
  sheet.querySelector('[data-go="trip"]').onclick=()=>{close();showTrip()};
  sheet.querySelector('[data-go="track"]').onclick=()=>{close();showTrack()};
}
function mount(){if(document.querySelector('.tdh-global-menu'))return;const x=document.createElement('div');x.className='tdh-global-menu';x.innerHTML='<button type="button">MENU ☰</button>';x.firstElementChild.onclick=open;document.body.appendChild(x)}
setTimeout(mount,1200);new MutationObserver(mount).observe(document.body,{childList:true,subtree:false});
window.TDHGlobalNav={open,showTrip,showPlanning,showTrack};
})();