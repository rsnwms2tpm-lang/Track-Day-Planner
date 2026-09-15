(() => {
  // Once a real trip is confirmed, keep the crew in the operational Trip app.
  // `state` is a shared global lexical binding in the legacy app, not window.state.
  const activeConfirmedTrip=()=>{
    try { return typeof state !== 'undefined' && !!state?.confirmedEventId; }
    catch (_) { return false; }
  };

  const apply=()=>{
    if(!activeConfirmedTrip()) return;
    document.body.classList.remove('planning-archive-mode');
    document.body.classList.add('trip-mode');

    // Planning v2 stays preserved for later, but cannot be reached while this
    // confirmed trip is active.
    const p=document.querySelector('#planningV2');
    if(p) p.style.setProperty('display','none','important');
    document.querySelectorAll('[data-view-planning],[data-planning-back]').forEach(el=>el.remove());
  };

  const observer=new MutationObserver(apply);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('focus',apply);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply()});
  setInterval(apply,500);
  apply();
})();