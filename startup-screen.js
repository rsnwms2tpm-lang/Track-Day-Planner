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

    // The Trip UI is assembled/enhanced by several late-running controllers. Rather
    // than exposing those intermediate paints, wait until its visible structure has
    // stopped changing for a short settling window.
    const activeTab = shell.querySelector('.trip-tab.active')?.dataset?.tripTab || '';
    const activePanel = shell.querySelector('[data-trip-panel].active')?.dataset?.tripPanel || '';
    const tabs = [...shell.querySelectorAll('.trip-tab:not([hidden])')].map(x => x.dataset.tripTab || '').join(',');
    const signature = [activeTab, activePanel, tabs, shell.textContent?.length || 0].join('|');
    const now = Date.now();

    if (signature !== lastSignature) {
      lastSignature = signature;
      stableSince = now;
      return false;
    }
    return stableSince > 0 && now - stableSince >= 700;
  }

  function reveal() {
    if (finished) return;
    finished = true;
    const minimum = 350;
    const wait = Math.max(0, minimum - (Date.now() - started));
    setTimeout(() => {
      root.classList.remove('tdh-booting');
      if (!screen) return;
      screen.classList.add('tdh-startup-done');
      setTimeout(() => screen.remove(), 260);
    }, wait);
  }

  function ready() {
    if (hasSession()) {
      if (!hydrated()) return false;
      return tripReady();
    }
    return document.readyState === 'complete';
  }

  function check() {
    if (ready()) reveal();
  }

  window.addEventListener('load', check);
  window.addEventListener('focus', check);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });

  check();
  const poll = setInterval(() => {
    if (finished) { clearInterval(poll); return; }
    check();
  }, 100);

  // Safety escape only. Normal Trip launches should reveal after the Trip shell has
  // hydrated and remained visually stable, not merely when member data first arrives.
  setTimeout(reveal, 6000);
})();