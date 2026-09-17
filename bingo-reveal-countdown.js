(()=>{
  const MESSAGES=['GET TO THE PUB 🍺','WHO’S BREAKING WHAT? 👀','ARE YOU READY TO DRIVE? 🏁','THE PREDICTIONS ARE LOCKED 🔒','NO CHANGING YOUR MIND NOW…','SOMEONE’S GETTING STITCHED UP 😂','WHO’S BEEN BACKED TO BREAK FIRST?','THE CREW HAVE SPOKEN.'];
  const style=document.createElement('style');
  style.textContent=`
    .tdh-reveal-countdown{position:relative;overflow:hidden;min-height:58vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:34px 22px!important;border-color:#493654!important;background:radial-gradient(circle at 50% 15%,#2b1b34 0,#151119 42%,#0d1014 100%)!important}
    .tdh-reveal-countdown:before,.tdh-reveal-countdown:after{content:"";position:absolute;border:1px solid rgba(114,223,158,.18);border-radius:50%;width:240px;height:240px;animation:tdhRevealPulse 3s ease-in-out infinite}
    .tdh-reveal-countdown:after{width:360px;height:360px;animation-delay:.8s;opacity:.45}
    .tdh-reveal-inner{position:relative;z-index:1;width:min(560px,100%)}
    .tdh-reveal-kicker{font-size:10px;font-weight:950;letter-spacing:.18em;color:#72df9e}.tdh-reveal-countdown h2{margin:12px 0 5px;font-size:clamp(30px,8vw,52px);line-height:1}.tdh-reveal-countdown p{margin:0;color:#9da7b1}
    .tdh-reveal-clock{margin:34px 0 27px;font-variant-numeric:tabular-nums;font-size:clamp(48px,14vw,86px);font-weight:950;letter-spacing:-.05em}.tdh-reveal-clock small{display:block;margin-top:8px;font-size:9px;letter-spacing:.2em;color:#77838d}
    .tdh-reveal-message{min-height:42px;font-size:clamp(18px,5vw,25px);font-weight:900;letter-spacing:.02em;transition:opacity .3s ease}.tdh-reveal-message.fade{opacity:0}
    @keyframes tdhRevealPulse{0%,100%{transform:scale(.82);opacity:.18}50%{transform:scale(1.08);opacity:.5}}
    @media(prefers-reduced-motion:reduce){.tdh-reveal-countdown:before,.tdh-reveal-countdown:after{animation:none}.tdh-reveal-message{transition:none}}
  `;document.head.appendChild(style);

  function parseReveal(raw){
    if(!raw)return null;
    const direct=new Date(raw);if(!Number.isNaN(direct.getTime())&&/[T\-]/.test(String(raw)))return direct;
    const m=String(raw).match(/(\d{1,2}):(\d{2})/);if(!m)return null;
    const now=new Date(),d=new Date(now);d.setHours(+m[1],+m[2],0,0);if(d<=now)d.setDate(d.getDate()+1);return d;
  }
  function mount(panel,revealRaw,onReveal){
    if(!panel)return;
    const target=parseReveal(revealRaw);if(!target)return;
    panel.innerHTML=`<section class="tdh-reveal-countdown"><div class="tdh-reveal-inner"><div class="tdh-reveal-kicker">🎰 BINGO LOCKED</div><h2>THE REVEAL IS COMING.</h2><p>Every prediction is in. Nobody’s changing a thing now.</p><div class="tdh-reveal-clock" data-tdh-reveal-clock>--:--:--<small>UNTIL THE CARDS ARE ON THE TABLE</small></div><div class="tdh-reveal-message" data-tdh-reveal-message>${MESSAGES[0]}</div></div></section>`;
    let message=0,lastSwap=Date.now();
    const clock=panel.querySelector('[data-tdh-reveal-clock]'),copy=panel.querySelector('[data-tdh-reveal-message]');
    const tick=()=>{const left=target-new Date();if(left<=0){clearInterval(timer);onReveal?.();return}const total=Math.ceil(left/1000),h=Math.floor(total/3600),m=Math.floor(total%3600/60),s=total%60;clock.childNodes[0].nodeValue=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;if(Date.now()-lastSwap>6500){lastSwap=Date.now();copy.classList.add('fade');setTimeout(()=>{message=(message+1)%MESSAGES.length;copy.textContent=MESSAGES[message];copy.classList.remove('fade')},300)}};
    tick();const timer=setInterval(tick,1000);panel._tdhRevealCleanup=()=>clearInterval(timer);
  }
  window.TDHBingoRevealCountdown={mount};
})();