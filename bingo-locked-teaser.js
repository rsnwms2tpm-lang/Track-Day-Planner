(() => {
  const style=document.createElement('style');
  style.textContent=`
    [data-trip-panel="bingo"].bingo-preunlock .bingo-hero h2,
    [data-trip-panel="bingo"].bingo-preunlock .bingo-hero p,
    [data-trip-panel="bingo"].bingo-preunlock .bingo-timing,
    [data-trip-panel="bingo"].bingo-preunlock .bingo-locked-card{display:none!important}
    [data-trip-panel="bingo"].bingo-preunlock .bingo-hero{padding:22px 18px!important;text-align:center}
    [data-trip-panel="bingo"].bingo-preunlock .bingo-state{margin-top:14px}
    .bingo-away-overlay.bingo-preunlock .bingo-away-hero h2,
    .bingo-away-overlay.bingo-preunlock .bingo-away-hero p,
    .bingo-away-overlay.bingo-preunlock .bingo-away-timing,
    .bingo-away-overlay.bingo-preunlock .bingo-away-locked{display:none!important}
    .bingo-away-overlay.bingo-preunlock .bingo-away-hero{padding:22px 18px!important;text-align:center}
    .bingo-away-overlay.bingo-preunlock .bingo-away-state{margin-top:14px}
  `;
  document.head.appendChild(style);

  function applyBooked(){
    const panel=document.querySelector('[data-trip-panel="bingo"]');
    if(!panel)return;
    const locked=!!panel.querySelector('.bingo-state strong')?.textContent?.includes('BINGO LOCKED');
    panel.classList.toggle('bingo-preunlock',locked);
    if(locked){
      const status=panel.querySelector('.bingo-state span');
      if(status)status.textContent='Sort the accommodation to unlock the game.';
    }
  }

  function applyAway(){
    const overlay=document.querySelector('[data-bingo-away-overlay]');
    if(!overlay)return;
    const locked=!!overlay.querySelector('.bingo-away-state strong')?.textContent?.includes('BINGO LOCKED');
    overlay.classList.toggle('bingo-preunlock',locked);
    if(locked){
      const status=overlay.querySelector('.bingo-away-state span');
      if(status)status.textContent='Sort the accommodation to unlock the game.';
    }
  }

  function tick(){applyBooked();applyAway()}
  setInterval(tick,300);
  tick();
})();