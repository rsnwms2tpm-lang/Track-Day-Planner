(() => {
  const root = document.documentElement;
  const screen = document.getElementById('tdhStartup');
  let finished = false;
  const started = Date.now();

  const hasSession = () => {
    try { return !!(session?.groupId && session?.memberToken); } catch (_) { return false; }
  };

  const hydrated = () => {
    try { return !!(state?.me && state?.group && Array.isArray(state?.members) && state.members.length); } catch (_) { return false; }
  };

  function reveal() {
    if (finished) return;
    finished = true;
    const minimum = 260;
    const wait = Math.max(0, minimum - (Date.now() - started));
    setTimeout(() => {
      root.classList.remove('tdh-booting');
      if (!screen) return;
      screen.classList.add('tdh-startup-done');
      setTimeout(() => screen.remove(), 260);
    }, wait);
  }

  function ready() {
    // Existing Crew session: wait until the server-backed group state has hydrated.
    if (hasSession()) return hydrated();
    // No Crew session means there is nothing to hydrate; existing invite/login logic
    // can present its normal entry state without exposing intermediate planning screens.
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
  }, 80);

  // Never leave somebody trapped behind the loader if hydration/network recovery fails.
  setTimeout(reveal, 4500);
})();