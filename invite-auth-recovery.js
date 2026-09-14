(() => {
  const params = new URLSearchParams(location.search);
  const invite = (params.get('invite') || '').trim();
  if (!invite) return;

  const nativeFetch = window.fetch.bind(window);
  let recovering = false;

  window.fetch = async (...args) => {
    const response = await nativeFetch(...args);
    if (recovering || response.ok) return response;

    try {
      const url = String(args[0]?.url || args[0] || '');
      if (!url.includes('/functions/v1/track-day-api') || !url.includes('action=group')) return response;

      const payload = await response.clone().json().catch(() => null);
      const message = String(payload?.error || payload?.detail || '');
      if (response.status !== 401 || !/invalid group credentials/i.test(message)) return response;

      recovering = true;
      localStorage.removeItem('tdp-session');
      localStorage.removeItem('tdp-persistent-session');

      // Keep the invite in the URL. On reload app.js has no stale session,
      // so normal onboarding + crew-login can offer the existing crew names.
      location.replace(`${location.origin}${location.pathname}?invite=${encodeURIComponent(invite)}`);
    } catch {
      // Never interfere with normal requests if recovery inspection fails.
    }

    return response;
  };
})();
