(() => {
  const params = new URLSearchParams(location.search);
  const invite = (params.get('invite') || '').trim() || localStorage.getItem('tdp-last-invite') || 'BB1F0D07';
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
      localStorage.setItem('tdp-last-invite', invite);
      location.replace(`${location.origin}${location.pathname}?invite=${encodeURIComponent(invite)}`);
    } catch {}
    return response;
  };
})();
