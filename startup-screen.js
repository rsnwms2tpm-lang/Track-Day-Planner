(() => {
  const root = document.documentElement;
  const screen = document.getElementById('tdhStartup');
  let finished = false;
  let stableSince = 0;
  let lastSignature = '';
  const started = Date.now();

  const hasSession = () => {
    try { return !!(session?.groupId && session?.memberToken); } catch (_) { return false; }
  };

  const hydrated = () => {
    try { return !!(state?.me && state?.group && Array.isArray(state?.members) && state.members.length); } catch (_) { return false; }
  };

  const hasConfirmedTrip = () => {
    try { return !!state?.confirmedEventId; } catch (_) { return false; }
  };

  function tripReady() {
    if (!hasConfirmedTrip()) return true;
    const shell = document.querySelector('.trip-mode-shell');
    if (!shell) return false;
    const activeTab = shell.querySelector('.trip-tab.active')?.dataset?.tripTab || '';
    const activePanel = shell.querySelector('[data-trip-panel].active')?.dataset?.tripPanel || '';
    const tabs = [...shell.querySelectorAll('.trip-tab:not([hidden])')].map(x => x.dataset.tripTab || '').join(',');
    const signature = [activeTab, activePanel, tabs, shell.textContent?.length || 0].join('|');
    const now = Date.now();
    if (signature !== lastSignature) { lastSignature = signature; stableSince = now; return false; }
    return stableSince > 0 && now - stableSince >= 700;
  }

  function reveal() {
    if (finished) return;
    finished = true;
    const minimum = 1400;
    const wait = Math.max(0, minimum - (Date.now() - started));
    setTimeout(() => {
      root.classList.remove('tdh-booting');
      if (screen) { screen.classList.add('tdh-startup-done'); setTimeout(() => { screen.remove(); window.dispatchEvent(new Event('tdh:startup-complete')); }, 260); } else { window.dispatchEvent(new Event('tdh:startup-complete')); }
    }, wait);
  }

  function ready() {
    if (hasSession()) { if (!hydrated()) return false; return tripReady(); }
    return document.readyState === 'complete';
  }
  function check() { if (ready() && window.__tdhStartupRouteReady===true) reveal(); }
  window.addEventListener('load', check);
  window.addEventListener('focus', check);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  check();
  const poll = setInterval(() => { if (finished) { clearInterval(poll); return; } check(); }, 100);
  setTimeout(() => { if(window.__tdhStartupRouteReady!==true) window.__tdhStartupRouteReady=true; reveal(); }, 6000);

  // Track Day Mode is deliberately loaded after the proven planning/Trip startup path.
  // Laps helpers are shared with Passenger; Track Day Mode itself decides whether the
  // 03:00 event-day gate has been reached before it changes anything on screen.
  function loadTrackDayMode(){
    if(!document.querySelector('script[src^="/laps-shared.js"]')){const l=document.createElement('script');l.src='/laps-shared.js?v=20260918-2025';document.body.appendChild(l)}
    if(!document.querySelector('script[src^="/track-day-mode.js"]')){const t=document.createElement('script');t.src='/track-day-mode.js?v=20260918-2025';document.body.appendChild(t)}
  }
  setTimeout(loadTrackDayMode,1200);
})();