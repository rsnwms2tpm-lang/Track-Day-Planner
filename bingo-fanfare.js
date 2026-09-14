(() => {
  const style=document.createElement('style');
  style.textContent=`
    .bingo-fanfare{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:24px;background:rgba(7,8,11,.94);backdrop-filter:blur(12px);animation:bingoFadeIn .22s ease-out}
    .bingo-fanfare-card{position:relative;width:min(430px,100%);overflow:hidden;text-align:center;padding:36px 24px 28px;border:1px solid #5a3d68;border-radius:26px;background:radial-gradient(circle at 50% 5%,#3b2148 0,#1a1520 42%,#0e1115 100%);box-shadow:0 30px 90px rgba(0,0,0,.6);animation:bingoPop .5s cubic-bezier(.2,.9,.2,1.15)}
    .bingo-fanfare-reel{font-size:54px;line-height:1;margin-bottom:14px;animation:bingoReel .75s ease-out}
    .bingo-fanfare-card .eyebrow{color:#dba6ef;font-size:10px;letter-spacing:.19em}
    .bingo-fanfare-card h2{margin:8px 0 8px;font-size:31px;line-height:1.05}
    .bingo-fanfare-card p{margin:0 auto;color:#a9a0ae;font-size:13px;line-height:1.5;max-width:310px}
    .bingo-fanfare-card button{margin-top:22px;width:100%;min-height:48px}
    .bingo-fanfare-burst{position:absolute;inset:0;pointer-events:none;overflow:hidden}
    .bingo-fanfare-burst span{position:absolute;top:48%;left:50%;font-size:22px;opacity:0;animation:bingoBurst 1.15s ease-out forwards;animation-delay:var(--d)}
    .bingo-fanfare-burst span:nth-child(1){--x:-140px;--y:-150px;--r:-25deg;--d:.05s}.bingo-fanfare-burst span:nth-child(2){--x:135px;--y:-135px;--r:30deg;--d:.10s}.bingo-fanfare-burst span:nth-child(3){--x:-160px;--y:10px;--r:-40deg;--d:.16s}.bingo-fanfare-burst span:nth-child(4){--x:155px;--y:20px;--r:38deg;--d:.20s}.bingo-fanfare-burst span:nth-child(5){--x:-105px;--y:145px;--r:25deg;--d:.25s}.bingo-fanfare-burst span:nth-child(6){--x:110px;--y:150px;--r:-30deg;--d:.30s}
    @keyframes bingoFadeIn{from{opacity:0}to{opacity:1}}@keyframes bingoPop{0%{opacity:0;transform:scale(.82) translateY(18px)}100%{opacity:1;transform:scale(1) translateY(0)}}@keyframes bingoReel{0%{transform:rotate(-12deg) scale(.5)}65%{transform:rotate(5deg) scale(1.18)}100%{transform:rotate(0) scale(1)}}@keyframes bingoBurst{0%{opacity:0;transform:translate(-50%,-50%) scale(.5)}20%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--x)),calc(-50% + var(--y))) rotate(var(--r)) scale(1.15)}}
    @media(max-width:620px){.bingo-fanfare-card{padding:32px 20px 24px}.bingo-fanfare-card h2{font-size:28px}}
  `;
  document.head.appendChild(style);
  let showing=false;
  function unlockId(){return String(state?.bingoUnlockedAt||'').trim()}
  function key(){return `tdp-bingo-intro:${session?.groupId||''}:${state?.confirmedEventId||''}:${state?.me?.id||''}`}
  function seenThisUnlock(){const id=unlockId();return !!id&&localStorage.getItem(key())===id}
  function markSeen(){const id=unlockId();if(id)localStorage.setItem(key(),id)}
  function goBingo(attempt=0){const btn=document.querySelector('.trip-mode-shell [data-trip-tab="bingo"]');if(btn){btn.click();return}if(attempt<40)setTimeout(()=>goBingo(attempt+1),100)}
  function show(){
    if(showing||!state?.bingoUnlocked||!state?.confirmedEventId||!state?.me?.id||!unlockId()||seenThisUnlock())return;
    const shell=document.querySelector('.trip-mode-shell');if(!shell)return;
    showing=true;markSeen();
    const overlay=document.createElement('div');overlay.className='bingo-fanfare';overlay.innerHTML=`<div class="bingo-fanfare-card"><div class="bingo-fanfare-burst"><span>🔧</span><span>🏁</span><span>💥</span><span>🎯</span><span>🔩</span><span>😂</span></div><div class="bingo-fanfare-reel">🎰</div><span class="eyebrow">ACCOMMODATION SORTED</span><h2>BROKEN CAR BINGO<br>UNLOCKED!</h2><p>The boring bit is done. Time to decide whose car is going to disgrace itself first.</p><button class="primary" type="button">LET'S GO 🎯</button></div>`;
    document.body.appendChild(overlay);
    let finished=false;
    const finish=()=>{if(finished)return;finished=true;overlay.style.transition='opacity .18s ease';overlay.style.opacity='0';setTimeout(()=>{overlay.remove();showing=false;goBingo()},180)};
    overlay.querySelector('button').onclick=finish;
    setTimeout(finish,4200);
  }
  const observer=new MutationObserver(()=>show());observer.observe(document.documentElement,{childList:true,subtree:true});
  setInterval(show,400);
  show();
})();