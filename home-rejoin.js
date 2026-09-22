(() => {
  // Legacy standalone recovery only. Never inject a group invite into an
  // already-authenticated install: each Crew profile must retain its own
  // saved session and normal startup route.
  try {
    const params = new URLSearchParams(location.search);
    const hasInvite = !!(params.get('invite') || '').trim();
    const hasSession = !!localStorage.getItem('tdp-session') || !!localStorage.getItem('tdp-persistent-session');
    const standalone = window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true;
    if (!standalone || hasSession || hasInvite) return;
    // No automatic group redirect. A genuinely sessionless install should
    // use the normal join/create flow rather than being forced into a
    // hard-coded Track Day Heros group.
  } catch {}
})();