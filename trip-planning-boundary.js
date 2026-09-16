(() => {
  // Planning may initialise after the confirmed Trip shell. When a booked
  // confirmed trip is active, keep Planning mounted but inaccessible.
  const enforce = () => {
    const tripActive = document.body.classList.contains('trip-mode') && !!document.querySelector('.trip-mode-shell');
    const planning = document.querySelector('#planningV2');
    if (planning) planning.style.setProperty('display', tripActive ? 'none' : '', tripActive ? 'important' : '');
  };
  new MutationObserver(enforce).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  window.addEventListener('focus',enforce);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)enforce()});
  enforce();
})();