(() => {
  const style=document.createElement('style');
  style.textContent=`
    [data-trip-panel="bingo"].bingo-preunlock .bingo-hero h2,
    [data-trip-panel="bingo"].bingo-preunlock .bingo-hero p,
    [data-trip-panel="bingo"].bingo-preunlock .bingo-timing,
    [data-trip-panel="bingo"].bingo-preunlock .bingo-locked-card{display:none!important}
    [data-trip-panel="bingo"].bingo-preunlock .bingo-hero{padding:22px 18px!important;text-align:center}
    [data-trip-panel="bingo"].bingo-preunlock .bingo-state{display:block;margin-top:16px;padding:15px 14px}
    [data-trip-panel="bingo"].bingo-preunlock .bingo-state strong{display:block;font-size:15px;letter-spacing:.04em}
    [data-trip-panel="bingo"].bingo-preunlock .bingo-state span{display:block;margin-top:8px;text-align:center;font-size:11px;line-height:1.5}
    [data-trip-panel="bingo"].bingo-preunlock .bingo-state::after{content:'🔒  UNLOCK BINGO';display:block;margin-top:14px;padding:11px 12px;border:1px solid #4a3b55;border-radius:12px;background:#18131d;color:#d8cce0;font-size:10px;font-weight:900;letter-spacing:.12em}
    .bingo-away-overlay.bingo-preunlock .bingo-away-hero h2,
    .bingo-away-overlay.bingo-preunlock .bingo-away-hero p,
    .bingo-away-overlay.bingo-preunlock .bingo-away-timing,
    .bingo-away-overlay.bingo-preunlock .bingo-away-locked,
    .bingo-away-overlay.bingo-preunlock .bingo-away-note,
    .bingo-away-overlay.bingo-preunlock .bingo-away-secret,
    .bingo-away-overlay.bingo-preunlock .bingo-away-form,
    .bingo-away-overlay.bingo-preunlock .bingo-away-reveal{display:none!important}
    .bingo-away-overlay.bingo-preunlock .bingo-away-hero{padding:22px 18px!important;text-align:center}
    .bingo-away-overlay.bingo-preunlock .bingo-away-state{display:block;margin-top:16px;padding:15px 14px}
    .bingo-away-overlay.bingo-preunlock .bingo-away-state strong{display:block;font-size:15px;letter-spacing:.04em}
    .bingo-away-overlay.bingo-preunlock .bingo-away-state span{display:block;margin-top:8px;text-align:center;font-size:11px;line-height:1.5}
    .bingo-away-overlay.bingo-preunlock .bingo-away-state::after{content:'🔒  UNLOCK BINGO';display:block;margin-top:14px;padding:11px 12px;border:1px solid #4a3b55;border-radius:12px;background:#18131d;color:#d8cce0;font-size:10px;font-weight:900;letter-spacing:.12em}
  `;
  document.head.appendChild(style);

  if(!document.querySelector('script[data-bingo-passenger-ownership]')){const s=document.createElement('script');s.src='/bingo-passenger-ownership.js?v=20260918-0030';s.dataset.bingoPassengerOwnership='1';document.head.appendChild(s)}

  function tease(stateEl){const strong=stateEl?.querySelector('strong');const status=stateEl?.querySelector('span');if(strong)strong.textContent='Something’s waiting… 👀';if(status)status.textContent='Get the accommodation sorted and the game unlocks for the whole crew.'}
  function applyBooked(){const panel=document.querySelector('[data-trip-panel="bingo"]');if(!panel)return;const locked=state?.bingoUnlocked===false;panel.classList.toggle('bingo-preunlock',locked);if(locked)tease(panel.querySelector('.bingo-state'))}
  function applyAway(){const overlay=document.querySelector('[data-bingo-away-overlay]');if(!overlay)return;const stateEl=overlay.querySelector('.bingo-away-state');const strong=stateEl?.querySelector('strong')?.textContent||'';const locked=strong.includes('BINGO LOCKED')||strong.includes('Something’s waiting');overlay.classList.toggle('bingo-preunlock',locked);if(locked)tease(stateEl)}
  function tick(){applyBooked();applyAway()}setInterval(tick,300);tick();
})();