(() => {
  try {
    const params = new URLSearchParams(location.search);
    const hasInvite = !!(params.get('invite') || '').trim();
    const hasSession = !!localStorage.getItem('tdp-session');
    const standalone = window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true;
    if (!standalone || hasSession || hasInvite) return;
    const url = new URL(location.href);
    url.searchParams.set('invite', 'BB1F0D07');
    location.replace(url.toString());
  } catch {}
})();