(() => {
  // The existing booking controller already knows how to build and enter Trip mode.
  // This guard must NOT add trip-mode itself: doing so before the Trip shell exists
  // hides the normal app and produces a blank screen.
  const activeConfirmedTrip=()=>{
    try { return typeof state !== 'undefined' && !!state?.confirmedEventId; }
    catch (_) { return false; }
  };

  const apply=()=>{
    if(!activeConfirmedTrip()) return;

    // Preserve today's Planning v2 for later, but hide/remove routes to it only
    // after the normal confirmed-trip controller has rendered its Trip shell.
    const shell=document.querySelector('.trip-mode-shell');
    if(!shell) return;

    const p=document.querySelector('#planningV2');
    if(p) p.style.setProperty('display','none','important');
    document.querySelectorAll('[data-view-planning],[data-planning-back]').forEach(el=>el.remove());
  };

  const observer=new MutationObserver(apply);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('focus',apply);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply()});
  setInterval(apply,800);
  apply();
})();