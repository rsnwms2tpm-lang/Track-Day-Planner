(() => {
  // Once a real trip is confirmed, keep the crew in the operational Trip app.
  // Planning remains in the codebase for future trips, but is not reachable from
  // the crew UI while the confirmed event is active.
  const apply=()=>{
    if(!window.state?.confirmedEventId) return;
    document.body.classList.remove('planning-archive-mode');
    document.body.classList.add('trip-mode');

    // Today's Planning v2 is deliberately hidden for the active confirmed trip.
    const p=document.querySelector('#planningV2');
    if(p) p.style.setProperty('display','none','important');

    // Remove all routes back into Planning from the confirmed-trip experience.
    document.querySelectorAll('[data-view-planning],[data-planning-back]').forEach(el=>el.remove());
  };

  const observer=new MutationObserver(apply);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('focus',apply);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply()});
  setInterval(apply,800);
  apply();
})();