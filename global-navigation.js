(()=>{
const css=document.createElement('style');css.textContent=`
.tdh-global-menu{display:inline-flex;align-items:center;margin-left:auto}
.tdh-global-menu>button,#planningV2 .tdh-global-menu>button{min-height:0!important;border:1px solid #315d43!important;border-radius:999px!important;background:#16241d!important;color:#78e5a4!important;padding:7px 10px!important;font:900 10px system-ui,-apple-system,sans-serif!important;letter-spacing:.13em!important;line-height:1.2!important;box-shadow:none!important;white-space:nowrap}
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
function showTrip(tab){window.TDHPreEvent?.close?.();window.TDHResultsHome?.close?.();suspendTrack();hidePlanning();const s=tripShell();if(!s)return;s.style.removeProperty('display');document.body.classList.add('trip-mode');if(tab){window.__tdhSetBaseTripTab?.(tab);s.querySelector(`[data-trip-tab="${tab}"]`)?.click()}}
function showPlanning(){window.TDHPreEvent?.close?.();window.TDHResultsHome?.close?.();suspendTrack();document.body.classList.remove('trip-mode');const s=tripShell();if(s)s.style.setProperty('display','none','important');const p=planning();if(p)p.style.removeProperty('display')}
async function showEvent(){window.TDHResultsHome?.close?.();hidePlanning();document.getElementById('tdhPostTrack')?.remove();const s=tripShell();if(s)s.style.removeProperty('display');document.body.classList.add('trip-mode');await window.TDHPreEvent?.open?.()}
async function showResults(){window.TDHPreEvent?.close?.();suspendTrack();hidePlanning();document.getElementById('tdhPostTrack')?.remove();const s=tripShell();if(s)s.style.removeProperty('display');document.body.classList.add('trip-mode');await window.TDHResultsHome?.open?.()}
function close(){sheet?.remove();sheet=null}
function open(){close();sheet=document.createElement('div');sheet.className='tdh-global-sheet';sheet.innerHTML=`<div class="tdh-global-card"><small>NAVIGATE</small><button data-go="plan">PLAN <span>›</span></button><button data-go="travel">TRAVEL <span>›</span></button><button data-go="event">EVENT <span>›</span></button><button data-go="results">RESULTS <span>›</span></button></div>`;document.body.appendChild(sheet);sheet.onclick=e=>{if(e.target===sheet)close()};sheet.querySelector('[data-go="plan"]').onclick=()=>{close();showPlanning()};sheet.querySelector('[data-go="travel"]').onclick=()=>{close();showTrip('home')};sheet.querySelector('[data-go="event"]').onclick=()=>{close();showEvent()};sheet.querySelector('[data-go="results"]').onclick=()=>{close();showResults()}}
function overlayActive(){return !!document.querySelector('#tdhStartup,.bingo-fanfare,#tdhRaceFanfare')}
function header(){
 const p=planning();if(p&&getComputedStyle(p).display!=='none')return p.querySelector('.pv-top');
 const pre=document.getElementById('tdhPreEvent');if(pre)return pre.querySelector('.tdh-pe-brand');
 const results=document.getElementById('tdhResultsHome');if(results)return results.querySelector('.tdh-rh-brand');
 const post=document.getElementById('tdhPostTrack');if(post)return post.querySelector('.tdh-post-brand');
 const track=document.getElementById('tdhTrackDay');if(track)return track.querySelector('.tdh-track-brand,.tdh-brand,[class*="brand"]');
 const trip=tripShell();if(trip&&getComputedStyle(trip).display!=='none')return trip.querySelector('.trip-mode-brand');
 return document.querySelector('header.topbar')
}
function mount(){
 document.querySelectorAll('.tdh-global-menu').forEach(x=>x.remove());
 if(overlayActive())return;
 const h=header();if(!h)return;
 if(h.classList.contains('tdh-post-brand')){h.style.display='flex';h.style.alignItems='center';h.style.justifyContent='space-between';h.style.gap='12px'}
 const x=document.createElement('span');x.className='tdh-global-menu';x.innerHTML='<button type="button">MENU ☰</button>';x.firstElementChild.onclick=open;h.appendChild(x);
}
function refresh(){if(window.__tdhStayEditing===true)return;requestAnimationFrame(mount)}
setTimeout(refresh,1400);new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
window.addEventListener('tdh:startup-complete',refresh);
window.TDHGlobalNav={open,showTrip,showPlanning,showEvent,showResults,refresh};
})();